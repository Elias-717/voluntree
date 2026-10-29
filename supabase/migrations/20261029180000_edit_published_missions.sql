-- Editing published missions (DEC-057). Organizers and admins may edit a published mission until it
-- starts. Once any student has joined (pending dean approval or accepted), the date and time are
-- locked, so nobody is surprised by a new time or double-booked, and slots can't drop below the
-- students already in. Criteria keep their own lock (BR-14, check_mission_criteria).
-- Changes made without a signed-in user (seed scripts, the SQL editor, re-timing the demo mission)
-- are not checked. Status changes alone (cancel_mission) are not edits.

create function public.check_mission_edit()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_held integer;
begin
  if auth.uid() is null or old.status <> 'PUBLISHED' then
    return new;
  end if;
  if (new.title, new.description, new.place, new.required_skills, new.safety_notes,
      new.capacity, new.starts_at, new.ends_at)
     is not distinct from
     (old.title, old.description, old.place, old.required_skills, old.safety_notes,
      old.capacity, old.starts_at, old.ends_at) then
    return new;
  end if;

  if old.starts_at <= now() then
    raise exception 'STARTED: a mission cannot be edited once it has started';
  end if;
  select count(*) into v_held from public.mission_assignments
  where mission_id = old.id and status <> 'DEAN_REJECTED';
  if v_held > 0 and (new.starts_at is distinct from old.starts_at or new.ends_at is distinct from old.ends_at) then
    raise exception 'TIME_LOCKED: the date and time cannot change once a student has joined';
  end if;
  if new.capacity < v_held then
    raise exception 'CAPACITY_BELOW_HELD: % students have already joined', v_held;
  end if;
  return new;
end;
$$;

create trigger missions_check_edit
  before update on public.missions
  for each row execute function public.check_mission_edit();
