-- Phase 1: helper functions, triggers, row-level security and grants (FR-002, NFR-01, NFR-07).
-- Rule of thumb: everyone reads through policies; important writes (accept, approve,
-- revoke, dean decision) go only through the functions in the next migration.

-- Helpers used by policies ---------------------------------------------------
-- security definer so policies can look up other tables without recursion.

create function public.my_role()
returns public.user_role
language sql stable security definer set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.is_org_member(p_organization_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = p_organization_id and user_id = auth.uid()
  );
$$;

-- True when the signed-in organizer runs the mission's organization.
create function public.is_mission_organizer(p_mission_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.missions m
    join public.organization_members om on om.organization_id = m.organization_id
    where m.id = p_mission_id and om.user_id = auth.uid()
  );
$$;

-- Eligibility rule (FR-029): school in the list (or the list is empty) and,
-- if a minimum is set, a declared CGPA at least that value.
-- Internal: not callable by users, so no one can probe another student's CGPA.
create function public.student_meets_criteria(p_mission_id uuid, p_student_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((
    select (cardinality(m.eligible_schools) = 0 or sp.school = any (m.eligible_schools))
       and (m.min_cgpa is null or (sp.cgpa is not null and sp.cgpa >= m.min_cgpa))
    from public.missions m
    join public.student_profiles sp on sp.user_id = p_student_id
    where m.id = p_mission_id
  ), false);
$$;

-- The signed-in student's own eligibility, for the missions policy.
create function public.i_meet_criteria(p_mission_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.student_meets_criteria(p_mission_id, auth.uid());
$$;

create function public.has_assignment(p_mission_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.mission_assignments
    where mission_id = p_mission_id and student_id = auth.uid()
  );
$$;

-- True when the student has an assignment on one of the signed-in organizer's missions.
create function public.is_my_mission_student(p_student_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.mission_assignments a
    join public.missions m on m.id = a.mission_id
    join public.organization_members om on om.organization_id = m.organization_id
    where a.student_id = p_student_id and om.user_id = auth.uid()
  );
$$;

-- Writes one audit row as the signed-in user. Used by triggers and functions.
create function public.write_audit(p_entity text, p_entity_id text, p_action text, p_details jsonb)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.audit_events (actor_id, entity, entity_id, action, details)
  values (auth.uid(), p_entity, p_entity_id, p_action, coalesce(p_details, '{}'));
$$;

-- Triggers -------------------------------------------------------------------

-- Append-only tables reject updates and deletes (NFR-07).
create function public.reject_change()
returns trigger
language plpgsql
as $$
begin
  raise exception 'APPEND_ONLY: % rows cannot be changed or deleted', tg_table_name
    using errcode = '42501';
end;
$$;

create trigger watering_ledger_append_only
  before update or delete on public.watering_ledger
  for each row execute function public.reject_change();

create trigger audit_events_append_only
  before update or delete on public.audit_events
  for each row execute function public.reject_change();

create trigger certificates_never_deleted
  before delete on public.certificates
  for each row execute function public.reject_change();

-- Eligibility criteria: only admins set them, and they lock after the first acceptance (FR-029, BR-14).
-- auth.uid() is null for the service role and SQL editor (seed and test setup), which are trusted.
create function public.check_mission_criteria()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  criteria_set boolean;
begin
  if tg_op = 'INSERT' then
    criteria_set := cardinality(new.eligible_schools) > 0
      or new.min_cgpa is not null
      or new.dean_approval_required;
  else
    criteria_set := new.eligible_schools is distinct from old.eligible_schools
      or new.min_cgpa is distinct from old.min_cgpa
      or new.dean_approval_required is distinct from old.dean_approval_required;
  end if;

  if not criteria_set then
    return new;
  end if;

  if auth.uid() is not null and public.my_role() is distinct from 'admin' then
    raise exception 'FORBIDDEN: only an admin can set eligibility criteria'
      using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' and exists (select 1 from public.mission_assignments where mission_id = new.id) then
    raise exception 'CRITERIA_LOCKED: criteria cannot change once a student has accepted';
  end if;

  if tg_op = 'UPDATE' then
    perform public.write_audit('mission', new.id::text, 'criteria_changed', jsonb_build_object(
      'old', jsonb_build_object('eligible_schools', old.eligible_schools, 'min_cgpa', old.min_cgpa,
                                'dean_approval_required', old.dean_approval_required),
      'new', jsonb_build_object('eligible_schools', new.eligible_schools, 'min_cgpa', new.min_cgpa,
                                'dean_approval_required', new.dean_approval_required)));
  end if;
  return new;
end;
$$;

create trigger missions_check_criteria
  before insert or update on public.missions
  for each row execute function public.check_mission_criteria();

-- Every school or CGPA change is audited with the old and new value (FR-028).
create function public.audit_student_academic()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.school is distinct from old.school or new.cgpa is distinct from old.cgpa then
    perform public.write_audit('student_profile', new.user_id::text, 'academic_changed', jsonb_build_object(
      'old', jsonb_build_object('school', old.school, 'cgpa', old.cgpa),
      'new', jsonb_build_object('school', new.school, 'cgpa', new.cgpa)));
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger student_profiles_audit_academic
  before update on public.student_profiles
  for each row execute function public.audit_student_academic();

-- Row-level security ----------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.missions enable row level security;
alter table public.mission_assignments enable row level security;
alter table public.completions enable row level security;
alter table public.watering_ledger enable row level security;
alter table public.certificates enable row level security;
alter table public.audit_events enable row level security;

-- Profiles: own row; admins all; organizers see students on their missions. No self-edit of role.
create policy "profiles: read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.my_role() = 'admin' or public.is_my_mission_student(id));

-- Student details, including CGPA: the student and admins only (FR-028, BR-15).
create policy "student_profiles: read own or admin" on public.student_profiles for select to authenticated
  using (user_id = auth.uid() or public.my_role() = 'admin');

create policy "student_profiles: update own" on public.student_profiles for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "organizations: read" on public.organizations for select to authenticated
  using (true);

create policy "organization_members: read own or admin" on public.organization_members for select to authenticated
  using (user_id = auth.uid() or public.my_role() = 'admin');

-- Missions: admins all; organizers their own organization's missions plus published ones;
-- students only published missions they are eligible for, plus any they hold (FR-029).
create policy "missions: read" on public.missions for select to authenticated
  using (
    public.my_role() = 'admin'
    or (public.my_role() = 'organizer' and (public.is_org_member(organization_id) or status <> 'DRAFT'))
    or (public.my_role() = 'student' and (
          public.has_assignment(id)
          or (status = 'PUBLISHED' and public.i_meet_criteria(id))))
  );

create policy "missions: create" on public.missions for insert to authenticated
  with check (
    created_by = auth.uid()
    and (public.my_role() = 'admin' or (public.my_role() = 'organizer' and public.is_org_member(organization_id)))
  );

create policy "missions: edit" on public.missions for update to authenticated
  using (public.my_role() = 'admin' or (public.my_role() = 'organizer' and public.is_org_member(organization_id)))
  with check (public.my_role() = 'admin' or (public.my_role() = 'organizer' and public.is_org_member(organization_id)));

create policy "mission_assignments: read" on public.mission_assignments for select to authenticated
  using (student_id = auth.uid() or public.my_role() = 'admin' or public.is_mission_organizer(mission_id));

create policy "completions: read" on public.completions for select to authenticated
  using (exists (
    select 1 from public.mission_assignments a
    where a.id = assignment_id
      and (a.student_id = auth.uid() or public.my_role() = 'admin' or public.is_mission_organizer(a.mission_id))
  ));

-- Waterings: the student's own, and admins for audit. Organizers never (BR-13).
create policy "watering_ledger: read own or admin" on public.watering_ledger for select to authenticated
  using (student_id = auth.uid() or public.my_role() = 'admin');

create policy "certificates: read" on public.certificates for select to authenticated
  using (exists (
    select 1 from public.completions c
    join public.mission_assignments a on a.id = c.assignment_id
    where c.id = completion_id
      and (a.student_id = auth.uid() or public.my_role() = 'admin' or public.is_mission_organizer(a.mission_id))
  ));

create policy "audit_events: read own or admin" on public.audit_events for select to authenticated
  using (actor_id = auth.uid() or public.my_role() = 'admin');

-- Grants ------------------------------------------------------------------------
-- Signed-out visitors get nothing. Signed-in users read through the policies above.

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant select on all tables in schema public to authenticated;
grant insert, update on public.missions to authenticated;
grant update (skills, availability, matching_opt_out, school, cgpa) on public.student_profiles to authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.my_role(), public.is_org_member(uuid), public.is_mission_organizer(uuid),
  public.i_meet_criteria(uuid), public.has_assignment(uuid), public.is_my_mission_student(uuid)
  to authenticated;
-- Internal helpers: only triggers and functions call them.
revoke execute on function
  public.write_audit(text, text, text, jsonb), public.student_meets_criteria(uuid, uuid)
  from authenticated;
