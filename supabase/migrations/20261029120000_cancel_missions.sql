-- Cancelling missions (SRS §12 "Mission cancelled after sign-up: no penalty", DEC-047).

-- 1. Drafts may be incomplete, and so may a cancelled draft: only PUBLISHED and COMPLETED missions
--    must have every field (FR-004).
alter table public.missions drop constraint missions_check1;
alter table public.missions add constraint missions_complete_unless_draft check (
  status in ('DRAFT', 'CANCELLED')
  or (title is not null and description is not null and place is not null
      and starts_at is not null and ends_at is not null and capacity is not null)
);

-- 2. Staff cancel a draft or a published mission. Assignments stay as history but no longer hold
--    the students' time. A mission with an approved participation cannot be cancelled: the waterings
--    and certificates would be left without a mission, so an admin revokes them first.
create function public.cancel_mission(p_mission_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_mission public.missions;
begin
  select * into v_mission from public.missions where id = p_mission_id for update;
  if not found then
    raise exception 'NOT_FOUND: mission does not exist';
  end if;
  if not (public.my_role() = 'admin'
          or (public.my_role() = 'organizer' and public.is_org_member(v_mission.organization_id))) then
    raise exception 'FORBIDDEN: only the organizer or an admin can cancel this mission' using errcode = '42501';
  end if;
  if v_mission.status not in ('DRAFT', 'PUBLISHED') then
    raise exception 'NOT_CANCELLABLE: mission is %', v_mission.status;
  end if;
  if exists (
    select 1 from public.completions c
    join public.mission_assignments a on a.id = c.assignment_id
    where a.mission_id = p_mission_id and c.status = 'APPROVED'
  ) then
    raise exception 'HAS_APPROVALS: revoke the approved participations first';
  end if;

  update public.missions set status = 'CANCELLED' where id = p_mission_id;
  perform public.write_audit('mission', p_mission_id::text, 'cancelled',
    jsonb_build_object('previous_status', v_mission.status));
end;
$$;

revoke execute on function public.cancel_mission(uuid) from public, anon;
grant execute on function public.cancel_mission(uuid) to authenticated;

-- 3. accept_mission: assignments on cancelled missions no longer cause a time conflict.
create or replace function public.accept_mission(p_mission_id uuid)
returns public.mission_assignments
language plpgsql security definer set search_path = ''
as $$
declare
  v_student uuid := auth.uid();
  v_mission public.missions;
  v_assignment public.mission_assignments;
  v_held integer;
begin
  if public.my_role() is distinct from 'student' then
    raise exception 'FORBIDDEN: only students can accept missions' using errcode = '42501';
  end if;

  -- Lock the mission row: concurrent accepts for this mission wait here, one at a time.
  select * into v_mission from public.missions where id = p_mission_id for update;
  if not found then
    raise exception 'NOT_FOUND: mission does not exist';
  end if;

  -- Accepting twice returns the existing assignment unchanged.
  select * into v_assignment from public.mission_assignments
  where mission_id = p_mission_id and student_id = v_student;
  if found then
    if v_assignment.status = 'DEAN_REJECTED' then
      raise exception 'ALREADY_REJECTED: the dean did not approve this participation';
    end if;
    return v_assignment;
  end if;

  if v_mission.status <> 'PUBLISHED' then
    raise exception 'NOT_PUBLISHED: mission is not open for acceptance';
  end if;

  -- Eligibility is checked only here, at acceptance (FR-029, BR-14).
  if not public.student_meets_criteria(p_mission_id, v_student) then
    raise exception 'NOT_ELIGIBLE: student does not meet the mission criteria' using errcode = '42501';
  end if;

  select count(*) into v_held from public.mission_assignments
  where mission_id = p_mission_id and status in ('ACCEPTED', 'PENDING_DEAN_APPROVAL');
  if v_held >= v_mission.capacity then
    raise exception 'MISSION_FULL: no slots left';
  end if;

  -- Overlapping missions are rejected (SRS §12). Cancelled missions no longer hold time (DEC-047).
  if exists (
    select 1 from public.mission_assignments a
    join public.missions m on m.id = a.mission_id
    where a.student_id = v_student
      and a.status in ('ACCEPTED', 'PENDING_DEAN_APPROVAL')
      and m.status <> 'CANCELLED'
      and m.starts_at < v_mission.ends_at and v_mission.starts_at < m.ends_at
  ) then
    raise exception 'TIME_CONFLICT: overlaps another mission you accepted';
  end if;

  insert into public.mission_assignments (mission_id, student_id, status)
  values (
    p_mission_id, v_student,
    case when v_mission.dean_approval_required then 'PENDING_DEAN_APPROVAL' else 'ACCEPTED' end::public.assignment_status
  )
  returning * into v_assignment;

  perform public.write_audit('mission_assignment', v_assignment.id::text, 'accepted',
    jsonb_build_object('mission_id', p_mission_id, 'status', v_assignment.status));
  return v_assignment;
end;
$$;
