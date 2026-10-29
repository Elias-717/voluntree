-- In-app notifications (FR-012, DEC-058). Each person has an inbox. Rows are written by triggers on
-- the tables the existing functions already change, inside the same transaction, so every event gives
-- exactly one notification and nothing else had to change. People read their own and mark them read.
--
-- Students: invitation (a new mission they are eligible for), you're in / waiting for the dean, the
-- dean's decision, attendance approved (watering and certificate), marked absent, approval revoked,
-- a joined mission changed or cancelled. Organizers: a student joined, a student checked in.
-- Admins: a new dean approval request.
-- Missions of the Phase 1 test organization (DEC-044) never send invitations or admin alerts, so test
-- runs can't fill the demo accounts' inboxes.

create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index notifications_user_created on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
create policy "People read their own notifications" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "People mark their own notifications read" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke insert, update, delete on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

-- Internal helpers -------------------------------------------------------------------------------

create function public.notify(p_user uuid, p_kind text, p_title text, p_body text, p_link text)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.notifications (user_id, kind, title, body, link) values (p_user, p_kind, p_title, p_body, p_link);
$$;
revoke execute on function public.notify(uuid, text, text, text, text) from public, anon, authenticated;

create function public.is_test_organization(p_organization_id uuid)
returns boolean
language sql immutable set search_path = ''
as $$
  select p_organization_id = '00000000-0000-4000-d000-000000000100'::uuid;
$$;

-- Assignments: joining, waiting for the dean, the dean's decision -----------------------------------

create function public.notify_assignment()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_mission public.missions;
  v_student text;
  v_staff uuid;
begin
  select * into v_mission from public.missions where id = new.mission_id;
  select display_name into v_student from public.profiles where id = new.student_id;

  if tg_op = 'INSERT' then
    if new.status = 'ACCEPTED' then
      perform public.notify(new.student_id, 'joined', 'You''re in: ' || v_mission.title,
        'See you there. Your organizer confirms attendance on the day.', '/student/mission/' || new.mission_id);
    elsif new.status = 'PENDING_DEAN_APPROVAL' then
      perform public.notify(new.student_id, 'dean_pending', 'Request sent: ' || v_mission.title,
        'A dean says OK first. Your spot is held meanwhile.', '/student/mission/' || new.mission_id);
      if not public.is_test_organization(v_mission.organization_id) then
        for v_staff in select id from public.profiles where role = 'admin' and deactivated_at is null loop
          perform public.notify(v_staff, 'dean_request', 'Dean approval needed',
            v_student || ' asked to join ' || v_mission.title || '.', '/admin/dean');
        end loop;
      end if;
    end if;
    for v_staff in
      select om.user_id from public.organization_members om join public.profiles p on p.id = om.user_id
      where om.organization_id = v_mission.organization_id and p.role = 'organizer' and p.deactivated_at is null
    loop
      perform public.notify(v_staff, 'student_joined', v_student || ' joined',
        v_mission.title, '/organizer/mission/' || new.mission_id);
    end loop;

  elsif new.status is distinct from old.status then
    if old.status = 'PENDING_DEAN_APPROVAL' and new.status = 'ACCEPTED' then
      perform public.notify(new.student_id, 'dean_approved', 'The dean approved: ' || v_mission.title,
        'You''re in. See you there.', '/student/mission/' || new.mission_id);
    elsif new.status = 'DEAN_REJECTED' then
      perform public.notify(new.student_id, 'dean_rejected', 'The dean didn''t approve: ' || v_mission.title,
        coalesce(new.dean_note, 'Your spot was released. Other missions are still open to you.'), '/student/mission/' || new.mission_id);
    end if;
  end if;
  return new;
end;
$$;

create trigger assignments_notify
  after insert or update of status on public.mission_assignments
  for each row execute function public.notify_assignment();

-- Completions: approved (watering and certificate), absent, revoked ----------------------------------

create function public.notify_completion()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_student uuid;
  v_title text;
  v_mission uuid;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;
  select a.student_id, m.title, m.id into v_student, v_title, v_mission
  from public.mission_assignments a join public.missions m on m.id = a.mission_id
  where a.id = new.assignment_id;

  if new.status = 'APPROVED' then
    perform public.notify(v_student, 'approved', 'Attendance approved: ' || v_title,
      'Your tree got a watering and your certificate is ready.', '/student/certificates');
  elsif new.status = 'REJECTED' then
    perform public.notify(v_student, 'absent', 'Marked absent: ' || v_title,
      'If you were there, talk to your organizer.', '/student/mission/' || v_mission);
  elsif new.status = 'REVOKED' then
    perform public.notify(v_student, 'revoked', 'Approval revoked: ' || v_title,
      'An admin revoked this approval with a logged reason. The watering was removed and the certificate is revoked.', '/student/tree');
  end if;
  return new;
end;
$$;

create trigger completions_notify
  after insert or update of status on public.completions
  for each row execute function public.notify_completion();

-- Missions: invitations on publish; joined students told about changes and cancellations ------------

create function public.notify_mission()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_student uuid;
  v_changes text;
begin
  -- Invitation: newly published, upcoming, eligible students who haven't opted out of suggestions.
  if new.status = 'PUBLISHED' and (tg_op = 'INSERT' or old.status is distinct from 'PUBLISHED')
     and new.starts_at > now() and not public.is_test_organization(new.organization_id) then
    for v_student in
      select p.id from public.profiles p join public.student_profiles sp on sp.user_id = p.id
      where p.role = 'student' and p.deactivated_at is null and not sp.matching_opt_out
        and public.student_meets_criteria(new.id, p.id)
    loop
      perform public.notify(v_student, 'invitation', 'New mission: ' || new.title,
        new.place || ' · open to you. Take a look.', '/student/mission/' || new.id);
    end loop;
  end if;

  if tg_op = 'UPDATE' and old.status = 'PUBLISHED' then
    if new.status = 'CANCELLED' then
      for v_student in select student_id from public.mission_assignments where mission_id = new.id and status <> 'DEAN_REJECTED' loop
        perform public.notify(v_student, 'cancelled', 'Mission cancelled: ' || old.title,
          'Nothing is lost, and your time is free again.', '/student/missions');
      end loop;
    elsif new.status = 'PUBLISHED' and auth.uid() is not null then
      v_changes := array_to_string(array_remove(array[
        case when new.title is distinct from old.title then 'title' end,
        case when new.starts_at is distinct from old.starts_at or new.ends_at is distinct from old.ends_at then 'time' end,
        case when new.place is distinct from old.place then 'place' end,
        case when new.description is distinct from old.description then 'description' end,
        case when new.safety_notes is distinct from old.safety_notes then 'safety notes' end
      ], null), ', ');
      if v_changes <> '' then
        for v_student in select student_id from public.mission_assignments where mission_id = new.id and status <> 'DEAN_REJECTED' loop
          perform public.notify(v_student, 'changed', 'Mission updated: ' || new.title,
            'Changed: ' || v_changes || '. Check the details.', '/student/mission/' || new.id);
        end loop;
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger missions_notify
  after insert or update on public.missions
  for each row execute function public.notify_mission();

-- Check-ins: organizers see who has arrived ----------------------------------------------------------

create function public.notify_check_in()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_mission public.missions;
  v_student text;
  v_staff uuid;
begin
  select m.* into v_mission from public.missions m join public.mission_assignments a on a.mission_id = m.id
  where a.id = new.assignment_id;
  select p.display_name into v_student from public.profiles p join public.mission_assignments a on a.student_id = p.id
  where a.id = new.assignment_id;
  for v_staff in
    select om.user_id from public.organization_members om join public.profiles p on p.id = om.user_id
    where om.organization_id = v_mission.organization_id and p.role = 'organizer' and p.deactivated_at is null
  loop
    perform public.notify(v_staff, 'checked_in', v_student || ' checked in', v_mission.title, '/organizer/mission/' || v_mission.id);
  end loop;
  return new;
end;
$$;

create trigger check_ins_notify
  after insert on public.check_ins
  for each row execute function public.notify_check_in();
