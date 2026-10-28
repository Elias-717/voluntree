// Screen 13: dean approvals (FR-030). The admin records each dean's decision; waiting requests hold a slot.

import { MissionIcon } from "@/components/mission-icon";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";
import { formatDay } from "@/lib/format";
import { DeanButtons } from "./dean-buttons";

type Row = {
  id: string;
  applied_at: string;
  student_id: string;
  profiles: { display_name: string; student_profiles: { school: string; cgpa: number | null } | null };
  missions: { title: string; starts_at: string };
};

export default async function DeanApprovals() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("mission_assignments")
    .select("id, applied_at, student_id, profiles!mission_assignments_student_id_fkey(display_name, student_profiles(school, cgpa)), missions!inner(title, starts_at, status)")
    .eq("status", "PENDING_DEAN_APPROVAL")
    .neq("missions.status", "CANCELLED")
    .order("applied_at");
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-[-0.03em]">Dean approvals</h1>
      <p className="mb-6 text-sm text-muted">Record each dean&apos;s decision on their behalf. Waiting requests hold a slot.</p>
      {rows.length === 0 ? (
        <p className="rounded-[22px] border border-line bg-card p-6 text-sm text-muted">No requests waiting.</p>
      ) : (
        <div className="overflow-x-auto rounded-[22px] border border-line bg-card">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-b border-line">
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-3 py-3 font-medium">School</th>
                <th className="px-3 py-3 font-medium">CGPA</th>
                <th className="px-3 py-3 font-medium">Mission</th>
                <th className="px-3 py-3 font-medium">Asked</th>
                <th className="px-5 py-3 font-medium">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const sp = r.profiles.student_profiles;
                return (
                  <tr key={r.id}>
                    <td className="px-5 py-3 font-semibold">{r.profiles.display_name}</td>
                    <td className="px-3 py-3">{sp?.school ?? "–"}</td>
                    <td className="px-3 py-3">{sp?.cgpa != null ? Number(sp.cgpa).toFixed(2) : "None"}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <MissionIcon title={r.missions.title} />
                        <div>
                          <p className="font-medium">{r.missions.title}</p>
                          <p className="text-xs text-muted">{formatDay(r.missions.starts_at)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">{formatDay(r.applied_at)}</td>
                    <td className="px-5 py-3"><DeanButtons assignmentId={r.id} name={r.profiles.display_name} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
