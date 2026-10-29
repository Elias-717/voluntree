-- Demo seed (SRS §14, DEC-021). Synthetic data only: no real students.
-- 1 admin, 1 organizer, 8 students with mixed schools and CGPAs (one with none),
-- and varied past participation (0, 0, 1, 5, 4, 6, 9, 11) seeded as real completed
-- missions with ledger entries and certificates. The demo student, Farid, starts at
-- 5 waterings (already a sprout, DEC-056), so the approval in demo step 6 grows his tree to sapling.
--
-- Run once on an empty database, after the migrations:
--   1. node supabase/seed-users.mjs   (creates the logins; the password stays in .env.local)
--   2. this file, in the Supabase SQL editor

begin;

-- Fixed ids keep the demo and the tests predictable.
create temporary table seed_users (id uuid, email text, role public.user_role, display_name text) on commit drop;
insert into seed_users values
  ('00000000-0000-4000-a000-000000000001', 'admin@voluntree.test',     'admin',     'Madam Nadya'),
  ('00000000-0000-4000-a000-000000000002', 'organizer@voluntree.test', 'organizer', 'Madam Fazilah'),
  ('00000000-0000-4000-a000-000000000011', 'aisha@voluntree.test',     'student',   'Aisha Rahman'),
  ('00000000-0000-4000-a000-000000000012', 'daniel@voluntree.test',    'student',   'Daniel Okafor'),
  ('00000000-0000-4000-a000-000000000013', 'meilin@voluntree.test',    'student',   'Mei Lin Tan'),
  ('00000000-0000-4000-a000-000000000014', 'farid@voluntree.test',     'student',   'Farid Hassan'),
  ('00000000-0000-4000-a000-000000000015', 'priya@voluntree.test',     'student',   'Priya Nair'),
  ('00000000-0000-4000-a000-000000000016', 'omar@voluntree.test',      'student',   'Omar Abdullahi'),
  ('00000000-0000-4000-a000-000000000017', 'sofia@voluntree.test',     'student',   'Sofia Mendes'),
  ('00000000-0000-4000-a000-000000000018', 'yusuf@voluntree.test',     'student',   'Yusuf Ibrahim');

-- The auth users with these ids come from supabase/seed-users.mjs.
insert into public.profiles (id, role, display_name)
select id, role, display_name from seed_users;

-- Students: school, CGPA (Priya has none), skills and availability for matching.
insert into public.student_profiles (user_id, school, cgpa, skills, availability) values
  ('00000000-0000-4000-a000-000000000011', 'SCI',  3.80, '{"first aid","tutoring"}',
   '[{"start":"2026-11-03T08:00:00+08:00","end":"2026-11-03T18:00:00+08:00"},{"start":"2026-11-04T13:00:00+08:00","end":"2026-11-04T18:00:00+08:00"}]'),
  ('00000000-0000-4000-a000-000000000012', 'SBSS', 3.20, '{"registration desk","social media"}',
   '[{"start":"2026-11-03T08:00:00+08:00","end":"2026-11-03T14:00:00+08:00"}]'),
  ('00000000-0000-4000-a000-000000000013', 'SEHS', 2.90, '{"event setup","logistics"}',
   '[{"start":"2026-11-03T09:00:00+08:00","end":"2026-11-03T17:00:00+08:00"},{"start":"2026-11-04T09:00:00+08:00","end":"2026-11-04T17:00:00+08:00"}]'),
  ('00000000-0000-4000-a000-000000000014', 'SCI',  3.50, '{"registration desk","photography"}',
   '[{"start":"2026-11-03T08:00:00+08:00","end":"2026-11-03T13:00:00+08:00"},{"start":"2026-11-04T13:00:00+08:00","end":"2026-11-04T18:00:00+08:00"}]'),
  ('00000000-0000-4000-a000-000000000015', 'CFGS', null, '{"translation (Arabic)","registration desk"}',
   '[{"start":"2026-11-03T08:00:00+08:00","end":"2026-11-03T18:00:00+08:00"}]'),
  ('00000000-0000-4000-a000-000000000016', 'LC',   2.40, '{"event setup"}',
   '[{"start":"2026-11-04T08:00:00+08:00","end":"2026-11-04T18:00:00+08:00"}]'),
  ('00000000-0000-4000-a000-000000000017', 'SBSS', 3.00, '{"social media","photography","logistics"}',
   '[{"start":"2026-11-03T12:00:00+08:00","end":"2026-11-03T18:00:00+08:00"}]'),
  ('00000000-0000-4000-a000-000000000018', 'SCI',  2.70, '{"first aid","event setup","logistics"}',
   '[{"start":"2026-11-03T08:00:00+08:00","end":"2026-11-04T18:00:00+08:00"}]');

insert into public.organizations (id, name) values
  ('00000000-0000-4000-b000-000000000001', 'AIU Student Affairs (demo)');
insert into public.organization_members (organization_id, user_id) values
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000002');

-- Eleven past missions, each on its own day, all completed.
insert into public.missions (
  id, organization_id, title, description, required_skills, place, starts_at, ends_at,
  capacity, status, verification_policy, created_by, published_at
)
select ('00000000-0000-4000-c000-0000000010' || lpad(t.n::text, 2, '0'))::uuid,
       '00000000-0000-4000-b000-000000000001',
       t.title, 'Past demo mission (seeded history).', t.skills, t.place,
       timestamptz '2026-09-01 09:00+08' + make_interval(days => t.n * 3),
       timestamptz '2026-09-01 12:00+08' + make_interval(days => t.n * 3),
       10, 'COMPLETED', 'Organizer confirms attendance', '00000000-0000-4000-a000-000000000002',
       timestamptz '2026-08-25 09:00+08'
from (values
  (1,  'Library Book Drive',            '{"logistics"}'::text[],                'Main Library'),
  (2,  'Freshers Campus Tour',          '{"registration desk"}',                'Main Gate'),
  (3,  'Blood Donation Drive Helpers',  '{"first aid","registration desk"}',    'Student Centre'),
  (4,  'Peer Tutoring Evening',         '{"tutoring"}',                         'Learning Commons'),
  (5,  'Sports Day Setup',              '{"event setup","logistics"}',          'Sports Complex'),
  (6,  'Cultural Night Ushers',         '{"event setup"}',                      'Auditorium'),
  (7,  'Recycling Week Stall',          '{"social media"}',                     'Cafeteria Plaza'),
  (8,  'Career Fair Registration',      '{"registration desk"}',                'Convention Hall'),
  (9,  'Community Garden Day',          '{"logistics"}',                        'Campus Garden'),
  (10, 'Open Day Photography',          '{"photography"}',                      'Main Hall'),
  (11, 'Charity Run Marshals',          '{"first aid","logistics"}',            'Campus Ring Road')
) as t (n, title, skills, place);

-- Past participation: student k takes part in the first N past missions.
create temporary table seed_history (student_id uuid, missions integer) on commit drop;
insert into seed_history values
  ('00000000-0000-4000-a000-000000000011', 0),
  ('00000000-0000-4000-a000-000000000012', 0),
  ('00000000-0000-4000-a000-000000000013', 1),
  ('00000000-0000-4000-a000-000000000014', 5),
  ('00000000-0000-4000-a000-000000000015', 4),
  ('00000000-0000-4000-a000-000000000016', 6),
  ('00000000-0000-4000-a000-000000000017', 9),
  ('00000000-0000-4000-a000-000000000018', 11);

-- Seeded as the same rows approve_completion writes: assignment, approved completion,
-- one +1 watering and one valid certificate each.
insert into public.mission_assignments (mission_id, student_id, status, applied_at)
select ('00000000-0000-4000-c000-0000000010' || lpad(n::text, 2, '0'))::uuid, h.student_id, 'ACCEPTED',
       timestamptz '2026-08-26 10:00+08'
from seed_history h cross join generate_series(1, h.missions) as n;

insert into public.completions (assignment_id, status, reviewed_by, reviewed_at)
select a.id, 'APPROVED', '00000000-0000-4000-a000-000000000002', m.ends_at
from public.mission_assignments a join public.missions m on m.id = a.mission_id
where m.status = 'COMPLETED';

insert into public.watering_ledger (student_id, completion_id, delta, reason, idempotency_key, created_by, created_at)
select a.student_id, c.id, 1, 'Approved participation', 'approve:' || c.id || ':0',
       '00000000-0000-4000-a000-000000000002', c.reviewed_at
from public.completions c join public.mission_assignments a on a.id = c.assignment_id;

insert into public.certificates (completion_id, issued_at)
select c.id, c.reviewed_at from public.completions c order by c.reviewed_at, c.id;

-- Upcoming and demo missions.
insert into public.missions (
  id, organization_id, title, description, required_skills, place, starts_at, ends_at, capacity,
  status, verification_policy, safety_notes, eligible_schools, min_cgpa, dean_approval_required,
  created_by, published_at
) values
  -- Open to everyone; capacity 4 for demo step 5 (a fifth accept is refused).
  ('00000000-0000-4000-c000-000000002001', '00000000-0000-4000-b000-000000000001',
   'New Student Arrival Welcome', 'Welcome new students at the Main Gate, hand out welcome packs and point them the right way.',
   '{"registration desk"}', 'Main Gate',
   '2026-11-03 09:00+08', '2026-11-03 13:00+08', 4,
   'PUBLISHED', 'Organizer confirms attendance', 'Stay hydrated; breaks every hour.',
   '{}', null, false, '00000000-0000-4000-a000-000000000002', '2026-10-27 10:00+08'),
  -- Posted by the admin: SCI only, minimum CGPA 3.00, dean approval required (demo steps 4 and 5).
  ('00000000-0000-4000-c000-000000002002', '00000000-0000-4000-b000-000000000001',
   'Red Cross Kedah Flood Aid', 'Help the Red Cross sort and pack flood-relief supplies for families in Kedah.',
   '{"tutoring","registration desk"}', 'Alor Setar',
   '2026-11-04 14:00+08', '2026-11-04 17:00+08', 3,
   'PUBLISHED', 'Organizer confirms attendance', null,
   '{"SCI"}', 3.00, true, '00000000-0000-4000-a000-000000000001', '2026-10-27 11:00+08'),
  -- Already happened; Farid and Mei Lin attended and wait for approval (demo step 6).
  ('00000000-0000-4000-c000-000000002003', '00000000-0000-4000-b000-000000000001',
   'Building D Cleaning Help', 'Tidy, sweep and sort the shared spaces of Building D.',
   '{"event setup","logistics"}', 'Building D',
   '2026-10-27 08:00+08', '2026-10-27 11:00+08', 6,
   'PUBLISHED', 'Organizer confirms attendance', 'Gloves provided; closed shoes required.',
   '{}', null, false, '00000000-0000-4000-a000-000000000002', '2026-10-20 10:00+08');

insert into public.mission_assignments (mission_id, student_id, status, applied_at) values
  ('00000000-0000-4000-c000-000000002003', '00000000-0000-4000-a000-000000000014', 'ACCEPTED', '2026-10-21 09:00+08'),
  ('00000000-0000-4000-c000-000000002003', '00000000-0000-4000-a000-000000000013', 'ACCEPTED', '2026-10-21 09:30+08');

-- In progress for the QR check-in demo (DEC-052): started 30 minutes ago, ends in 3 hours.
-- Farid and Mei Lin are confirmed. Before a pitch, move it back into progress with:
--   update public.missions set starts_at = now() - interval '30 minutes', ends_at = now() + interval '3 hours'
--   where id = '00000000-0000-4000-c000-000000002004';
insert into public.missions (
  id, organization_id, title, description, required_skills, place, starts_at, ends_at, capacity,
  status, verification_policy, safety_notes, eligible_schools, min_cgpa, dean_approval_required,
  created_by, published_at
) values
  ('00000000-0000-4000-c000-000000002004', '00000000-0000-4000-b000-000000000001',
   'Campus Open Day Helpers', 'Guide visiting families around campus and help at the information booth.',
   '{"registration desk"}', 'Main Hall',
   now() - interval '30 minutes', now() + interval '3 hours', 6,
   'PUBLISHED', 'Organizer confirms attendance', null,
   '{}', null, false, '00000000-0000-4000-a000-000000000002', now() - interval '2 days');

insert into public.mission_assignments (mission_id, student_id, status, applied_at) values
  ('00000000-0000-4000-c000-000000002004', '00000000-0000-4000-a000-000000000014', 'ACCEPTED', now() - interval '1 day'),
  ('00000000-0000-4000-c000-000000002004', '00000000-0000-4000-a000-000000000013', 'ACCEPTED', now() - interval '1 day');

commit;
