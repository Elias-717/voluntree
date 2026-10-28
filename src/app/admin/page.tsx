// Screen 15: admin overview (DEC-027). Counters, how opportunities are spread (counts only, no names),
// and recent activity from the audit log.

import Link from "next/link";
import { Plus } from "@phosphor-icons/react/ssr";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";
import { loadStaffMissions } from "@/lib/db/staff";
import { formatDay, formatTime } from "@/lib/format";

const BUCKETS = [
  { label: "0", test: (n: number) => n === 0 },
  { label: "1 to 2", test: (n: number) => n >= 1 && n <= 2 },
  { label: "3 to 5", test: (n: number) => n >= 3 && n <= 5 },
  { label: "6 or more", test: (n: number) => n >= 6 },
];

const ACTIONS: Record<string, string> = {
  accepted: "joined a mission",
  approved: "approved a participation",
  rejected: "marked a student absent",
  revoked: "revoked an approval",
  dean_decision: "recorded a dean decision",
  criteria_changed: "set eligibility criteria",
  consent_recorded: "updated matching consent",
  academic_changed: "changed school or CGPA",
};

export default async function AdminOverview() {
  await requireRole("admin");
  const supabase = await createClient();
  const [missions, { data: students }, { data: approvals }, { data: pending }, { count: certificates }, { data: activity }] =
    await Promise.all([
      loadStaffMissions(supabase),
      supabase.from("profiles").select("id").eq("role", "student").is("deactivated_at", null),
      supabase.from("completions").select("mission_assignments!inner(student_id)").eq("status", "APPROVED"),
      supabase.from("mission_assignments").select("applied_at, missions!inner(status)").eq("status", "PENDING_DEAN_APPROVAL").neq("missions.status", "CANCELLED").order("applied_at"),
      supabase.from("certificates").select("id, completions!inner(mission_assignments!inner(missions!inner(status)))", { count: "exact", head: true }).eq("status", "VALID").neq("completions.mission_assignments.missions.status", "CANCELLED"),
      supabase.from("audit_events").select("id, action, created_at, profiles(display_name, deactivated_at)").order("created_at", { ascending: false }).limit(20),
    ]);

  const activeIds = new Set((students ?? []).map((s) => s.id as string));
  const perStudent = new Map<string, number>([...activeIds].map((id) => [id, 0]));
  for (const a of (approvals ?? []) as unknown as { mission_assignments: { student_id: string } }[]) {
    const id = a.mission_assignments.student_id;
    if (perStudent.has(id)) perStudent.set(id, perStudent.get(id)! + 1);
  }
  const counts = BUCKETS.map((b) => [...perStudent.values()].filter(b.test).length);
  const tallest = Math.max(1, ...counts);
  const approvedTotal = [...perStudent.values()].reduce((s, n) => s + n, 0);

  const published = missions.filter((m) => m.status === "PUBLISHED");
  const open = published.filter((m) => new Date(m.starts_at) > new Date());
  const gated = missions.filter((m) => m.eligible_schools.length > 0 || m.min_cgpa !== null).length;
  const recent = ((activity ?? []) as unknown as {
    id: number; action: string; created_at: string; profiles: { display_name: string; deactivated_at: string | null } | null;
  }[]).filter((e) => e.profiles && !e.profiles.deactivated_at).slice(0, 6);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">Overview</h1>
          <p className="text-sm text-muted">All missions</p>
        </div>
        <Link href="/admin/new" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-medium text-on-primary">
          <Plus size={18} aria-hidden /> New mission
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Counter label="Missions published" value={String(published.length)}
          sub={`+ ${missions.filter((m) => m.status === "COMPLETED").length} completed`} />
        <Counter label="Slots filled" value={`${open.reduce((s, m) => s + m.held, 0)} / ${open.reduce((s, m) => s + (m.capacity ?? 0), 0)}`} sub="upcoming missions" />
        <Counter label="Dean approvals waiting" value={String(pending?.length ?? 0)}
          sub={pending?.length ? `oldest ${formatDay(pending[0].applied_at)}` : "none waiting"} />
        <Counter label="Participations approved" value={String(approvedTotal)} sub={`${certificates ?? 0} valid certificates`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-[22px] border border-line bg-card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold">How opportunities are spread</h2>
            <p className="text-xs text-muted">{activeIds.size} students · counts only, no names</p>
          </div>
          <figure className="mt-5">
            <div className="flex h-44 items-end gap-4 border-b border-line" role="img"
              aria-label={BUCKETS.map((b, i) => `${counts[i]} students with ${b.label} approved participations`).join(", ")}>
              {counts.map((n, i) => (
                <div key={BUCKETS[i].label} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-sm font-semibold">{n}</span>
                  <span className="w-full rounded-t-[8px] bg-primary" style={{ height: `${(n / tallest) * 130}px` }} />
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-4 text-center text-xs text-muted">
              {BUCKETS.map((b) => <span key={b.label} className="flex-1">{b.label}</span>)}
            </div>
            <figcaption className="mt-1 text-center text-xs text-muted">Approved participations per student</figcaption>
          </figure>
          <p className="mt-4 rounded-[14px] bg-tint p-3 text-sm text-on-tint">
            Students with fewer past opportunities get a boost in recommendations. {gated} of {missions.length} missions
            {gated === 1 ? " is" : " are"} limited by school or CGPA.
          </p>
        </section>

        <section className="rounded-[22px] border border-line bg-card p-5">
          <h2 className="font-semibold">Recent activity</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {recent.length === 0 && <li className="py-3 text-muted">Nothing yet.</li>}
            {recent.map((e) => (
              <li key={e.id} className="flex justify-between gap-3 py-3">
                <span><span className="font-medium">{e.profiles!.display_name}</span> {ACTIONS[e.action] ?? e.action}</span>
                <span className="shrink-0 text-xs text-muted">{formatDay(e.created_at)} {formatTime(e.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function Counter({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[22px] border border-line bg-card p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-4xl font-semibold tracking-[-0.03em]">{value}</p>
      <p className="mt-1 text-xs text-muted">{sub}</p>
    </div>
  );
}
