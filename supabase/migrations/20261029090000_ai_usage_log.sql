-- AiUsageLog (SRS §7, FR-023, DEC-046): one row per AI call, for the competition declaration form.
-- The prompt itself is not stored, only its hash. Append-only like the other logs (NFR-07).

create table public.ai_usage_log (
  id bigint generated always as identity primary key,
  feature text not null,
  model text not null,
  version text not null,
  prompt_hash text not null,
  actor_id uuid references public.profiles (id) default auth.uid(),
  succeeded boolean not null,
  created_at timestamptz not null default now()
);

create index on public.ai_usage_log (actor_id);

create trigger ai_usage_log_append_only
  before update or delete on public.ai_usage_log
  for each row execute function public.reject_change();

alter table public.ai_usage_log enable row level security;

-- Staff who draft missions write their own rows; only admins read the log.
create policy "ai_usage_log: staff insert own" on public.ai_usage_log for insert to authenticated
  with check (actor_id = auth.uid() and public.my_role() in ('organizer', 'admin'));
create policy "ai_usage_log: admin read" on public.ai_usage_log for select to authenticated
  using (public.my_role() = 'admin');

grant select, insert on public.ai_usage_log to authenticated;
grant all on public.ai_usage_log to service_role;
