-- Phase 2: database support for the student screens (FR-025, FR-006, DEC-040, DEC-043).

-- Consent (FR-025): the student records the notice version they saw and whether they opt out of
-- matching. Profiles have no direct update grant, so this is the only way to set consent.
create function public.record_consent(p_version text, p_opt_out boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if public.my_role() is distinct from 'student' then
    raise exception 'FORBIDDEN: only students give matching consent' using errcode = '42501';
  end if;
  if p_version is null or btrim(p_version) = '' then
    raise exception 'REASON_REQUIRED: consent version is required';
  end if;

  update public.profiles set consent_version = p_version, consented_at = now() where id = auth.uid();
  update public.student_profiles set matching_opt_out = coalesce(p_opt_out, false) where user_id = auth.uid();

  perform public.write_audit('profile', auth.uid()::text, 'consent_recorded',
    jsonb_build_object('version', p_version, 'matching_opt_out', coalesce(p_opt_out, false)));
end;
$$;

-- Spots taken on each published mission (FR-006). Students cannot read other students'
-- assignments, so this returns only the count, never who holds the spots.
-- Pending dean approvals hold a spot, as in accept_mission (FR-030).
create function public.mission_spots()
returns table (mission_id uuid, held integer)
language sql stable security definer set search_path = ''
as $$
  select m.id, count(a.id)::integer
  from public.missions m
  left join public.mission_assignments a
    on a.mission_id = m.id and a.status in ('ACCEPTED', 'PENDING_DEAN_APPROVAL')
  where m.status = 'PUBLISHED'
  group by m.id;
$$;

-- Optional student phone number (DEC-040). It sits on student_profiles, which only the student
-- and admins can read. Organizers get it only through mission_contacts below, so they never
-- see the CGPA on the same row.
alter table public.student_profiles
  add column phone text check (phone is null or phone ~ '^\+?[0-9][0-9 ()-]{6,19}$');

grant update (phone) on public.student_profiles to authenticated;

-- The organizer's contact list for one mission: names and phone numbers of students with a
-- PENDING_DEAN_APPROVAL or ACCEPTED assignment. DEAN_REJECTED gives no access (DEC-040).
create function public.mission_contacts(p_mission_id uuid)
returns table (student_id uuid, display_name text, phone text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not (public.my_role() = 'admin' or public.is_mission_organizer(p_mission_id)) then
    raise exception 'FORBIDDEN: only the mission organizer or an admin' using errcode = '42501';
  end if;
  return query
    select a.student_id, p.display_name, sp.phone
    from public.mission_assignments a
    join public.profiles p on p.id = a.student_id
    join public.student_profiles sp on sp.user_id = a.student_id
    where a.mission_id = p_mission_id and a.status in ('ACCEPTED', 'PENDING_DEAN_APPROVAL')
    order by p.display_name;
end;
$$;

revoke execute on function
  public.record_consent(text, boolean), public.mission_spots(), public.mission_contacts(uuid)
  from public, anon;
grant execute on function
  public.record_consent(text, boolean), public.mission_spots(), public.mission_contacts(uuid)
  to authenticated;
