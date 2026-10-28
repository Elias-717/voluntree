-- Phase 1: the core journey functions (FR-006, FR-008, FR-009, FR-010, FR-029, FR-030).
-- Each runs in one transaction and locks the row it changes, so concurrent or
-- repeated calls cannot double-book a slot or double-count a watering.
--
-- Errors start with a stable code the screens can map to a message:
-- FORBIDDEN, NOT_FOUND, NOT_PUBLISHED, NOT_ELIGIBLE, MISSION_FULL, TIME_CONFLICT,
-- ALREADY_REJECTED, NOT_ACCEPTED, NOT_PENDING, ALREADY_APPROVED, NOT_APPROVED,
-- REASON_REQUIRED, CERTIFICATE_REVOKED.

-- Student accepts a mission (FR-006). Pending dean approval holds a slot (FR-030).
create function public.accept_mission(p_mission_id uuid)
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

  -- Overlapping missions are rejected (SRS §12).
  if exists (
    select 1 from public.mission_assignments a
    join public.missions m on m.id = a.mission_id
    where a.student_id = v_student
      and a.status in ('ACCEPTED', 'PENDING_DEAN_APPROVAL')
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

-- Admin records the dean's decision on the dean's behalf (FR-030). Rejection frees the slot.
create function public.record_dean_decision(p_assignment_id uuid, p_approved boolean, p_note text default null)
returns public.mission_assignments
language plpgsql security definer set search_path = ''
as $$
declare
  v_assignment public.mission_assignments;
begin
  if public.my_role() is distinct from 'admin' then
    raise exception 'FORBIDDEN: only an admin can record a dean decision' using errcode = '42501';
  end if;

  select * into v_assignment from public.mission_assignments where id = p_assignment_id for update;
  if not found then
    raise exception 'NOT_FOUND: assignment does not exist';
  end if;
  if v_assignment.status <> 'PENDING_DEAN_APPROVAL' then
    raise exception 'NOT_PENDING: assignment is not waiting for dean approval';
  end if;

  update public.mission_assignments
  set status = case when p_approved then 'ACCEPTED' else 'DEAN_REJECTED' end::public.assignment_status,
      dean_decided_by = auth.uid(),
      dean_decided_at = now(),
      dean_note = nullif(btrim(p_note), '')
  where id = p_assignment_id
  returning * into v_assignment;

  perform public.write_audit('mission_assignment', p_assignment_id::text, 'dean_decision',
    jsonb_build_object('approved', p_approved, 'note', v_assignment.dean_note));
  return v_assignment;
end;
$$;

-- Shared check for approve and reject: admin, or an organizer of the mission (FR-008, BR-09).
create function public.lock_assignment_for_review(p_assignment_id uuid)
returns public.mission_assignments
language plpgsql security definer set search_path = ''
as $$
declare
  v_assignment public.mission_assignments;
begin
  select * into v_assignment from public.mission_assignments where id = p_assignment_id for update;
  if not found then
    raise exception 'NOT_FOUND: assignment does not exist';
  end if;
  if not (public.my_role() = 'admin'
          or (public.my_role() = 'organizer' and public.is_mission_organizer(v_assignment.mission_id))) then
    raise exception 'FORBIDDEN: only the mission organizer or an admin can review attendance' using errcode = '42501';
  end if;
  -- Pending or dean-rejected students cannot receive a watering or certificate (FR-030).
  if v_assignment.status <> 'ACCEPTED' then
    raise exception 'NOT_ACCEPTED: assignment status is %', v_assignment.status;
  end if;
  return v_assignment;
end;
$$;

-- Organizer approves attendance (FR-008): exactly one watering and one certificate (FR-009, FR-010, BR-07).
-- Repeating the call changes nothing. Approving after a revocation reactivates the same certificate.
create function public.approve_completion(p_assignment_id uuid, p_note text default null)
returns public.completions
language plpgsql security definer set search_path = ''
as $$
declare
  v_assignment public.mission_assignments;
  v_completion public.completions;
  v_cycle integer;
begin
  -- Locks the assignment, so concurrent approvals of it run one at a time.
  v_assignment := public.lock_assignment_for_review(p_assignment_id);

  select * into v_completion from public.completions where assignment_id = p_assignment_id;
  if found and v_completion.status = 'APPROVED' then
    return v_completion;
  end if;

  if found then
    update public.completions
    set status = 'APPROVED', reviewed_by = auth.uid(), note = nullif(btrim(p_note), ''), reviewed_at = now()
    where id = v_completion.id
    returning * into v_completion;
  else
    insert into public.completions (assignment_id, status, reviewed_by, note)
    values (p_assignment_id, 'APPROVED', auth.uid(), nullif(btrim(p_note), ''))
    returning * into v_completion;
  end if;

  -- One key per approval cycle: 0 for the first approval, 1 after the first revocation, and so on.
  select count(*) into v_cycle from public.watering_ledger
  where completion_id = v_completion.id and delta = -1;

  insert into public.watering_ledger (student_id, completion_id, delta, reason, idempotency_key, created_by)
  values (v_assignment.student_id, v_completion.id, 1, 'Approved participation',
          'approve:' || v_completion.id || ':' || v_cycle, auth.uid())
  on conflict (idempotency_key) do nothing;

  -- First approval issues the certificate; a re-approval reactivates the same serial (DEC-021).
  insert into public.certificates (completion_id)
  values (v_completion.id)
  on conflict (completion_id, template_version)
  do update set status = 'VALID', revocation_entry_id = null;

  perform public.write_audit('completion', v_completion.id::text, 'approved',
    jsonb_build_object('assignment_id', p_assignment_id, 'cycle', v_cycle));
  return v_completion;
end;
$$;

-- Organizer rejects attendance (FR-008): no watering, no certificate.
-- An approved completion cannot be rejected; only an admin revocation undoes it.
create function public.reject_completion(p_assignment_id uuid, p_note text default null)
returns public.completions
language plpgsql security definer set search_path = ''
as $$
declare
  v_completion public.completions;
begin
  perform public.lock_assignment_for_review(p_assignment_id);

  select * into v_completion from public.completions where assignment_id = p_assignment_id;
  if found and v_completion.status = 'APPROVED' then
    raise exception 'ALREADY_APPROVED: use an admin revocation to undo an approval';
  end if;

  if found then
    update public.completions
    set status = 'REJECTED', reviewed_by = auth.uid(), note = nullif(btrim(p_note), ''), reviewed_at = now()
    where id = v_completion.id
    returning * into v_completion;
  else
    insert into public.completions (assignment_id, status, reviewed_by, note)
    values (p_assignment_id, 'REJECTED', auth.uid(), nullif(btrim(p_note), ''))
    returning * into v_completion;
  end if;

  perform public.write_audit('completion', v_completion.id::text, 'rejected',
    jsonb_build_object('assignment_id', p_assignment_id));
  return v_completion;
end;
$$;

-- Admin revokes an approval with a reason (FR-009): a -1 ledger entry, and the certificate is marked revoked (FR-010).
create function public.revoke_completion(p_completion_id uuid, p_reason text)
returns public.completions
language plpgsql security definer set search_path = ''
as $$
declare
  v_completion public.completions;
  v_student uuid;
  v_cycle integer;
  v_entry_id bigint;
begin
  if public.my_role() is distinct from 'admin' then
    raise exception 'FORBIDDEN: only an admin can revoke an approval' using errcode = '42501';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'REASON_REQUIRED: a revocation needs a reason';
  end if;

  select * into v_completion from public.completions where id = p_completion_id for update;
  if not found then
    raise exception 'NOT_FOUND: completion does not exist';
  end if;
  if v_completion.status <> 'APPROVED' then
    raise exception 'NOT_APPROVED: only an approved completion can be revoked';
  end if;

  select student_id into v_student from public.mission_assignments where id = v_completion.assignment_id;
  select count(*) into v_cycle from public.watering_ledger
  where completion_id = p_completion_id and delta = -1;

  insert into public.watering_ledger (student_id, completion_id, delta, reason, idempotency_key, created_by)
  values (v_student, p_completion_id, -1, btrim(p_reason), 'revoke:' || p_completion_id || ':' || v_cycle, auth.uid())
  returning id into v_entry_id;

  update public.completions set status = 'REVOKED' where id = p_completion_id
  returning * into v_completion;

  update public.certificates set status = 'REVOKED', revocation_entry_id = v_entry_id
  where completion_id = p_completion_id;

  perform public.write_audit('completion', p_completion_id::text, 'revoked',
    jsonb_build_object('reason', btrim(p_reason), 'ledger_entry_id', v_entry_id));
  return v_completion;
end;
$$;

-- What the certificate PDF shows (FR-010). Rejected when revoked or not authorized.
-- The server route passes these fields to generateCertificatePdf.
create function public.get_certificate_for_download(p_certificate_id uuid)
returns table (serial text, student_name text, mission_title text, mission_date date)
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_certificate public.certificates;
  v_student uuid;
  v_mission public.missions;
begin
  select * into v_certificate from public.certificates where id = p_certificate_id;
  if not found then
    raise exception 'NOT_FOUND: certificate does not exist';
  end if;

  select a.student_id into v_student
  from public.completions c
  join public.mission_assignments a on a.id = c.assignment_id
  where c.id = v_certificate.completion_id;

  select m.* into v_mission
  from public.completions c
  join public.mission_assignments a on a.id = c.assignment_id
  join public.missions m on m.id = a.mission_id
  where c.id = v_certificate.completion_id;

  if not (v_student = auth.uid()
          or public.my_role() = 'admin'
          or public.is_mission_organizer(v_mission.id)) then
    raise exception 'FORBIDDEN: not your certificate' using errcode = '42501';
  end if;
  if v_certificate.status = 'REVOKED' then
    raise exception 'CERTIFICATE_REVOKED: this certificate was revoked' using errcode = '42501';
  end if;

  return query
    select v_certificate.serial,
           (select display_name from public.profiles where id = v_student),
           v_mission.title,
           (v_mission.starts_at at time zone 'Asia/Kuala_Lumpur')::date;
end;
$$;

-- Only signed-in users can call these; each function checks the role itself.
revoke execute on function
  public.accept_mission(uuid),
  public.record_dean_decision(uuid, boolean, text),
  public.lock_assignment_for_review(uuid),
  public.approve_completion(uuid, text),
  public.reject_completion(uuid, text),
  public.revoke_completion(uuid, text),
  public.get_certificate_for_download(uuid)
  from public, anon;
grant execute on function
  public.accept_mission(uuid),
  public.record_dean_decision(uuid, boolean, text),
  public.approve_completion(uuid, text),
  public.reject_completion(uuid, text),
  public.revoke_completion(uuid, text),
  public.get_certificate_for_download(uuid)
  to authenticated;
-- lock_assignment_for_review is internal.
revoke execute on function public.lock_assignment_for_review(uuid) from authenticated;
