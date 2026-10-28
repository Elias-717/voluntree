-- Phase 1 data foundation: types and tables (SRS §7 as amended by DEC-015 to DEC-023).
-- Row-level security, triggers and functions are in the next migrations.

-- Types ---------------------------------------------------------------------

create type public.user_role as enum ('student', 'organizer', 'admin');

-- AIU schools (FR-028).
create type public.school as enum ('SBSS', 'SEHS', 'SCI', 'CFGS', 'LC');

-- Oct 29 build states (FR-005). Intermediate states are Stretch.
create type public.mission_status as enum ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');

create type public.mission_source as enum ('manual', 'ai_draft');

-- PENDING_DEAN_APPROVAL and ACCEPTED hold a slot; DEAN_REJECTED does not (FR-030).
create type public.assignment_status as enum ('PENDING_DEAN_APPROVAL', 'ACCEPTED', 'DEAN_REJECTED');

-- REVOKED: an admin revoked an earlier approval (FR-009). It can be approved again.
create type public.completion_status as enum ('APPROVED', 'REJECTED', 'REVOKED');

create type public.certificate_status as enum ('VALID', 'REVOKED');

-- Tables --------------------------------------------------------------------

-- One row per login (FR-001). The id is the Supabase Auth user id.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  display_name text not null,
  consent_version text,
  consented_at timestamptz,
  deactivated_at timestamptz,
  created_at timestamptz not null default now()
);

-- Student-only details. Private: the student and admins only (FR-028, BR-15).
create table public.student_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  school public.school not null,
  -- Self-declared. null means none declared yet.
  cgpa numeric(3, 2) check (cgpa between 0 and 4),
  skills text[] not null default '{}',
  -- List of time windows: [{"start": "...", "end": "..."}].
  availability jsonb not null default '[]' check (jsonb_typeof(availability) = 'array'),
  matching_opt_out boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- Which organizers belong to which organization (SRS §7 organizer_ids).
create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (organization_id, user_id)
);

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  -- A draft may be incomplete (e.g. an AI draft with flagged blanks); see the publish check below.
  title text,
  description text,
  required_skills text[] not null default '{}',
  place text,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer check (capacity > 0),
  status public.mission_status not null default 'DRAFT',
  source public.mission_source not null default 'manual',
  verification_policy text,
  safety_notes text,
  -- Eligibility criteria: admin only, locked after the first acceptance (FR-029, BR-14).
  -- Empty eligible_schools means all schools; null min_cgpa means no threshold.
  eligible_schools public.school[] not null default '{}',
  min_cgpa numeric(3, 2) check (min_cgpa between 0 and 4),
  dean_approval_required boolean not null default false,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  check (ends_at > starts_at),
  -- Incomplete missions cannot be published (FR-004).
  check (
    status = 'DRAFT'
    or (title is not null and description is not null and place is not null
        and starts_at is not null and ends_at is not null and capacity is not null)
  )
);

create table public.mission_assignments (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions (id),
  student_id uuid not null references public.profiles (id),
  status public.assignment_status not null,
  applied_at timestamptz not null default now(),
  -- Links to the recommendations table added in Phase 3.
  recommendation_id uuid,
  dean_decided_by uuid references public.profiles (id),
  dean_decided_at timestamptz,
  dean_note text,
  -- One enrollment per student per mission (BR-02).
  unique (mission_id, student_id)
);

-- The organizer's attendance decision for one assignment (FR-008).
create table public.completions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.mission_assignments (id),
  status public.completion_status not null,
  reviewed_by uuid not null references public.profiles (id),
  note text,
  reviewed_at timestamptz not null default now()
);

-- Append-only (FR-009, NFR-07). +1 per approval, -1 per admin revocation.
create table public.watering_ledger (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.profiles (id),
  completion_id uuid not null references public.completions (id),
  delta smallint not null check (delta in (1, -1)),
  reason text not null check (btrim(reason) <> ''),
  -- e.g. "approve:<completion id>:0". Makes retried approvals harmless (BR-07).
  idempotency_key text not null unique,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create sequence public.certificate_serial_seq;

-- Never deleted. Revocation marks it REVOKED; re-approval makes the same row VALID again (FR-010, DEC-021).
-- The PDF is rebuilt from this row on download, so no file is stored.
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  completion_id uuid not null references public.completions (id),
  serial text not null unique
    default 'VT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.certificate_serial_seq')::text, 6, '0'),
  template_version text not null default 'v1',
  status public.certificate_status not null default 'VALID',
  revocation_entry_id bigint references public.watering_ledger (id),
  issued_at timestamptz not null default now(),
  unique (completion_id, template_version)
);

-- Append-only audit trail (NFR-07).
create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id),
  entity text not null,
  entity_id text,
  action text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Net waterings per student; the tree stage is derived from this (FR-027).
-- security_invoker: callers only see the ledger rows their own policies allow.
create view public.watering_totals with (security_invoker = true) as
  select student_id, sum(delta)::integer as waterings
  from public.watering_ledger
  group by student_id;

-- Indexes for foreign keys used in lookups and policies.
create index on public.organization_members (user_id);
create index on public.missions (organization_id);
create index on public.mission_assignments (student_id);
create index on public.watering_ledger (student_id);
create index on public.watering_ledger (completion_id);
create index on public.audit_events (actor_id);
