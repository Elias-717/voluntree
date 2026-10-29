-- Guest students (DEC-055): "Try as a new student" creates a synthetic student account for one visitor,
-- so people can try the whole journey without sharing Farid. Guests are left out of the admin
-- overview (counters, fairness chart, activity) so the demo numbers stay stable; they still appear on
-- the rosters of missions they join, so an organizer can approve them.
-- Only the server (service role) creates guests. Users have no update grant on profiles, so a guest
-- cannot change this flag.
alter table public.profiles add column is_guest boolean not null default false;
