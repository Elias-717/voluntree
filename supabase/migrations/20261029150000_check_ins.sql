-- QR check-in (FR-016, DEC-052). The organizer starts check-in, which gives the mission a random
-- secret. The QR holds a short code made from that secret and the current minute, so it changes
-- every minute. A student who scans it is recorded as checked in, once. Checking in never
-- approves attendance: the organizer still taps Present, so the watering rule is unchanged.

-- One check-in session per mission. Only the mission's organizer and admins can read the secret.
create table public.check_in_sessions (
  mission_id uuid primary key references public.missions (id),
  secret text not null default encode(extensions.gen_random_bytes(32), 'hex'),
  opened_by uuid not null references public.profiles (id),
  opened_at timestamptz not null default now()
);

-- One check-in per assignment.
create table public.check_ins (
  assignment_id uuid primary key references public.mission_assignments (id),
  checked_in_at timestamptz not null default now()
);

alter table public.check_in_sessions enable row level security;
alter table public.check_ins enable row level security;

create policy "Staff read their missions' check-in sessions" on public.check_in_sessions
  for select to authenticated
  using (public.my_role() = 'admin'
         or (public.my_role() = 'organizer' and public.is_mission_organizer(mission_id)));

create policy "Students read their own check-ins; staff read their missions'" on public.check_ins
  for select to authenticated
  using (exists (
    select 1 from public.mission_assignments a
    where a.id = assignment_id
      and (a.student_id = auth.uid()
           or public.my_role() = 'admin'
           or (public.my_role() = 'organizer' and public.is_mission_organizer(a.mission_id)))
  ));

-- Writes go only through the two functions below.
revoke insert, update, delete on public.check_in_sessions, public.check_ins from anon, authenticated;

-- The code for one minute: the first 12 hex characters of HMAC-SHA256(secret, "<mission id>:<minute>").
-- src/lib/check-in.ts computes the same value for the QR.
create function public.check_in_code(p_secret text, p_mission_id uuid, p_minute bigint)
returns text
language sql immutable set search_path = ''
as $$
  select left(encode(extensions.hmac(p_mission_id::text || ':' || p_minute::text, p_secret, 'sha256'), 'hex'), 12);
$$;
revoke execute on function public.check_in_code(text, uuid, bigint) from public, anon, authenticated;

-- Check-in is open from 1 hour before the start until the end of the mission.
create function public.open_check_in(p_mission_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_mission public.missions;
begin
  select * into v_mission from public.missions where id = p_mission_id;
  if not found then
    raise exception 'NOT_FOUND: mission does not exist';
  end if;
  if not (public.my_role() = 'admin'
          or (public.my_role() = 'organizer' and public.is_mission_organizer(p_mission_id))) then
    raise exception 'FORBIDDEN: only the mission organizer or an admin can start check-in' using errcode = '42501';
  end if;
  if v_mission.status <> 'PUBLISHED' then
    raise exception 'NOT_PUBLISHED: mission is %', v_mission.status;
  end if;
  if now() < v_mission.starts_at - interval '1 hour' or now() > v_mission.ends_at then
    raise exception 'NOT_OPEN: check-in runs from 1 hour before the start until the end';
  end if;
  -- Starting again keeps the same secret.
  insert into public.check_in_sessions (mission_id, opened_by) values (p_mission_id, auth.uid())
  on conflict (mission_id) do nothing;
end;
$$;
revoke execute on function public.open_check_in(uuid) from public, anon;
grant execute on function public.open_check_in(uuid) to authenticated;

-- A student checks in with the code from the QR. The current and the previous minute's code are
-- accepted, so a scan just as the code changes still works. Returns false if already checked in.
create function public.check_in(p_mission_id uuid, p_code text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_mission public.missions;
  v_session public.check_in_sessions;
  v_assignment public.mission_assignments;
  v_minute bigint := floor(extract(epoch from now()) / 60);
begin
  select * into v_mission from public.missions where id = p_mission_id;
  if not found or v_mission.status <> 'PUBLISHED' then
    raise exception 'NOT_OPEN: this mission is not open for check-in';
  end if;
  select * into v_assignment from public.mission_assignments
  where mission_id = p_mission_id and student_id = auth.uid();
  if not found or v_assignment.status <> 'ACCEPTED' then
    raise exception 'NOT_ACCEPTED: you are not confirmed on this mission';
  end if;
  select * into v_session from public.check_in_sessions where mission_id = p_mission_id;
  if not found or now() < v_mission.starts_at - interval '1 hour' or now() > v_mission.ends_at then
    raise exception 'NOT_OPEN: check-in is not running';
  end if;
  if coalesce(p_code, '') not in (public.check_in_code(v_session.secret, p_mission_id, v_minute),
                                  public.check_in_code(v_session.secret, p_mission_id, v_minute - 1)) then
    raise exception 'BAD_CODE: the code has expired';
  end if;

  insert into public.check_ins (assignment_id) values (v_assignment.id) on conflict (assignment_id) do nothing;
  return found;
end;
$$;
revoke execute on function public.check_in(uuid, text) from public, anon;
grant execute on function public.check_in(uuid, text) to authenticated;
