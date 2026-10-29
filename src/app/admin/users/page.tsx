// Admin: all users with their status (DEC-060). View only. Admins already read these tables (row-level
// security); CGPA stays admin-only (FR-028). The palm tree stays private to each student (BR-13), so
// this shows approved participations, not the tree.

import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/ssr";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";
import { formatDay } from "@/lib/format";

type Profile = {
  id: string;
  role: "student" | "organizer" | "admin";
  display_name: string;
  consent_version: string | null;
  deactivated_at: string | null;
  is_guest: boolean;
  created_at: string;
  student_profiles: { school: string; cgpa: number | null; matching_opt_out: boolean } | null;
  organization_members: { organizations: { name: string } | null }[];
};
type Status = "Active" | "Onboarding" | "Guest" | "Deactivated";

const ROLES = [
  { key: "all", label: "All" },
  { key: "student", label: "Students" },
  { key: "organizer", label: "Organizers" },
  { key: "admin", label: "Admins" },
] as const;

export default async function AdminUsers({ searchParams }: PageProps<"/admin/users">) {
  await requireRole("admin");
  const params = await searchParams;
  const role = ROLES.some((r) => r.key === params.role) ? String(params.role) : "all";
  const q = String(params.q ?? "").trim().toLowerCase();
  const showHidden = params.hidden === "1";

  const supabase = await createClient();
  const [{ data: profiles }, { data: assignments }, { data: approvals }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, role, display_name, consent_version, deactivated_at, is_guest, created_at, student_profiles(school, cgpa, matching_opt_out), organization_members(organizations(name))")
      .order("role")
      .order("display_name"),
    supabase.from("mission_assignments").select("student_id, status, missions!inner(starts_at, status)").neq("missions.status", "CANCELLED"),
    supabase.from("completions").select("mission_assignments!inner(student_id)").eq("status", "APPROVED"),
  ]);

  // Per student: approved participations, upcoming missions joined, requests waiting for the dean.
  const approved = new Map<string, number>();
  for (const a of (approvals ?? []) as unknown as { mission_assignments: { student_id: string } }[]) {
    approved.set(a.mission_assignments.student_id, (approved.get(a.mission_assignments.student_id) ?? 0) + 1);
  }
  const upcoming = new Map<string, number>();
  const pendingDean = new Map<string, number>();
  const now = new Date();
  for (const a of (assignments ?? []) as unknown as { student_id: string; status: string; missions: { starts_at: string } }[]) {
    if (a.status === "PENDING_DEAN_APPROVAL") pendingDean.set(a.student_id, (pendingDean.get(a.student_id) ?? 0) + 1);
    else if (a.status === "ACCEPTED" && new Date(a.missions.starts_at) > now) upcoming.set(a.student_id, (upcoming.get(a.student_id) ?? 0) + 1);
  }

  const statusOf = (p: Profile): Status =>
    p.deactivated_at ? "Deactivated" : p.is_guest ? "Guest" : p.role === "student" && !p.consent_version ? "Onboarding" : "Active";

  const all = (profiles ?? []) as unknown as Profile[];
  // Test logins (DEC-044) are deactivated; they and other deactivated accounts are hidden unless asked for.
  const visible = all.filter((p) => showHidden || !p.deactivated_at);
  const rows = visible.filter((p) => (role === "all" || p.role === role) && (!q || p.display_name.toLowerCase().includes(q)));
  const counts = Object.fromEntries(ROLES.map((r) => [r.key, visible.filter((p) => r.key === "all" || p.role === r.key).length]));
  const link = (next: Record<string, string>) => {
    const s = new URLSearchParams({ ...(role !== "all" && { role }), ...(q && { q }), ...(showHidden && { hidden: "1" }), ...next });
    for (const [k, v] of [...s.entries()]) if (!v) s.delete(k);
    return `/admin/users${s.size ? `?${s}` : ""}`;
  };

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-[-0.03em]">Users</h1>
      <p className="text-sm text-muted">Everyone with an account. CGPA is visible to admins only.</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <nav className="flex gap-1 rounded-full bg-tint p-1 text-sm font-medium" aria-label="Filter by role">
          {ROLES.map((r) => (
            <Link key={r.key} href={link({ role: r.key === "all" ? "" : r.key })} aria-current={role === r.key ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 ${role === r.key ? "bg-card" : "text-muted"}`}>
              {r.label} <span className="text-muted">{counts[r.key]}</span>
            </Link>
          ))}
        </nav>
        <form className="flex min-w-56 flex-1 items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-muted">
          {role !== "all" && <input type="hidden" name="role" value={role} />}
          {showHidden && <input type="hidden" name="hidden" value="1" />}
          <MagnifyingGlass size={18} aria-hidden />
          <label className="sr-only" htmlFor="user-search">Search by name</label>
          <input id="user-search" name="q" defaultValue={q} placeholder="Search by name" className="flex-1 bg-transparent text-text outline-none" />
        </form>
        <Link href={link({ hidden: showHidden ? "" : "1" })} className="text-sm font-medium text-muted underline-offset-4 hover:underline">
          {showHidden ? "Hide deactivated" : "Show deactivated"}
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-[22px] border border-line bg-card">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted">
            <tr className="border-b border-line">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-3 py-3 font-medium">Role</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">School · CGPA</th>
              <th className="px-3 py-3 font-medium">Participations</th>
              <th className="px-3 py-3 font-medium">Upcoming</th>
              <th className="px-3 py-3 font-medium">Suggestions</th>
              <th className="px-5 py-3 font-medium">Since</th>
            </tr>
          </thead>
          <tbody className="stagger divide-y divide-line">
            {rows.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-6 text-muted">No users match.</td></tr>
            )}
            {rows.map((p) => {
              const student = p.role === "student";
              const sp = p.student_profiles;
              const status = statusOf(p);
              const orgs = p.organization_members.map((m) => m.organizations?.name).filter(Boolean).join(", ");
              const dean = pendingDean.get(p.id) ?? 0;
              return (
                <tr key={p.id}>
                  <td className="px-5 py-3">
                    <p className="font-semibold">{p.display_name}</p>
                    {orgs && <p className="text-xs text-muted">{orgs}</p>}
                  </td>
                  <td className="px-3 py-3 capitalize">{p.role}</td>
                  <td className="px-3 py-3"><StatusTag status={status} /></td>
                  <td className="px-3 py-3">
                    {student && sp ? `${sp.school} · ${sp.cgpa === null ? "none" : Number(sp.cgpa).toFixed(2)}` : <span className="text-muted">—</span>}
                  </td>
                  <td className="px-3 py-3">{student ? approved.get(p.id) ?? 0 : <span className="text-muted">—</span>}</td>
                  <td className="px-3 py-3">
                    {student ? (
                      <>
                        {upcoming.get(p.id) ?? 0}
                        {dean > 0 && <span className="ml-2 rounded-full bg-brown-tint px-2 py-0.5 text-xs text-brown">{dean} waiting for dean</span>}
                      </>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td className="px-3 py-3">{student && sp ? (sp.matching_opt_out ? "Off" : "On") : <span className="text-muted">—</span>}</td>
                  <td className="px-5 py-3 text-muted">{formatDay(p.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">
        Participations are approved attendances, the same count the fairness chart uses. Each student&apos;s tree stays private to them.
      </p>
    </>
  );
}

function StatusTag({ status }: { status: Status }) {
  const style = {
    Active: "bg-tint text-on-tint",
    Onboarding: "bg-gauge-empty text-muted",
    Guest: "bg-gauge-empty text-muted",
    Deactivated: "bg-brown-tint text-brown",
  }[status];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>{status}</span>;
}
