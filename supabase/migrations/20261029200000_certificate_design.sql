-- Certificate design per mission (DEC-063). Organizers and admins choose one of three preset designs
-- (the admin-approved templates, BR-12), an accent colour and an optional one-line description of the
-- volunteering role. Each certificate keeps a snapshot of the design it was first issued with, so a
-- later change never alters a certificate already issued; a re-approval keeps the original snapshot.

alter table public.missions
  add column certificate_template text not null default 'classic'
    check (certificate_template in ('classic', 'modern', 'minimal')),
  add column certificate_accent text not null default 'green'
    check (certificate_accent in ('green', 'teal', 'navy', 'plum')),
  add column certificate_description text
    check (certificate_description is null or char_length(certificate_description) between 1 and 160);

-- The snapshot. Null on certificates issued before this change: they are drawn as Classic, green, as before.
alter table public.certificates
  add column design_template text,
  add column design_accent text,
  add column design_description text;

-- approve_completion: unchanged except that the first issue takes the snapshot from the mission.
create or replace function public.approve_completion(p_assignment_id uuid, p_note text default null)
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

  -- First approval issues the certificate with the mission's current design (DEC-063); a re-approval
  -- reactivates the same serial and keeps its original design (DEC-021).
  insert into public.certificates (completion_id, design_template, design_accent, design_description)
  select v_completion.id, m.certificate_template, m.certificate_accent, m.certificate_description
  from public.missions m where m.id = v_assignment.mission_id
  on conflict (completion_id, template_version)
  do update set status = 'VALID', revocation_entry_id = null;

  perform public.write_audit('completion', v_completion.id::text, 'approved',
    jsonb_build_object('assignment_id', p_assignment_id, 'cycle', v_cycle));
  return v_completion;
end;
$$;

-- get_certificate_for_download now also returns the design snapshot. Its result type changes, so it
-- is dropped and created again with the same checks.
drop function public.get_certificate_for_download(uuid);
create function public.get_certificate_for_download(p_certificate_id uuid)
returns table (serial text, student_name text, mission_title text, mission_date date,
               design_template text, design_accent text, design_description text)
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
           (v_mission.starts_at at time zone 'Asia/Kuala_Lumpur')::date,
           coalesce(v_certificate.design_template, 'classic'),
           coalesce(v_certificate.design_accent, 'green'),
           v_certificate.design_description;
end;
$$;

revoke execute on function public.get_certificate_for_download(uuid) from public, anon;
grant execute on function public.get_certificate_for_download(uuid) to authenticated;
