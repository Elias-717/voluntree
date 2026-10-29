// Screen 14: approved participations, with revoke and a required reason (FR-010).

import { MissionIcon } from "@/components/mission-icon";
import { RevokeButton } from "@/components/review-buttons";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";
import { formatDay, formatTime } from "@/lib/format";

type Row = {
  id: string;
  reviewed_at: string;
  profiles: { display_name: string } | null;
  certificates: { serial: string }[] | { serial: string } | null;
  mission_assignments: {
    mission_id: string;
    profiles: { display_name: string; deactivated_at: string | null };
    missions: { title: string; starts_at: string };
  };
};

export default async function Approvals() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("completions")
    .select("id, reviewed_at, profiles(display_name), certificates(serial), mission_assignments!inner(mission_id, profiles!mission_assignments_student_id_fkey(display_name, deactivated_at), missions(title, starts_at))")
    .eq("status", "APPROVED")
    .order("reviewed_at", { ascending: false })
    .limit(60);
  const rows = ((data ?? []) as unknown as Row[]).filter((r) => !r.mission_assignments.profiles.deactivated_at);

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-[-0.03em]">Approved participations</h1>
      <p className="mb-6 text-sm text-muted">Revoking removes one watering and marks the certificate revoked. Approving again later brings the same certificate back.</p>
      <div className="overflow-x-auto rounded-[22px] border border-line bg-card">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted">
            <tr className="border-b border-line">
              <th className="px-5 py-3 font-medium">Student</th>
              <th className="px-3 py-3 font-medium">Mission</th>
              <th className="px-3 py-3 font-medium">Approved</th>
              <th className="px-3 py-3 font-medium">Certificate</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="stagger divide-y divide-line">
            {rows.map((r) => {
              const a = r.mission_assignments;
              const cert = Array.isArray(r.certificates) ? r.certificates[0] : r.certificates;
              return (
                <tr key={r.id}>
                  <td className="px-5 py-3 font-semibold">{a.profiles.display_name}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <MissionIcon title={a.missions.title} />
                      <div>
                        <p className="font-medium">{a.missions.title}</p>
                        <p className="text-xs text-muted">{formatDay(a.missions.starts_at)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">{r.profiles?.display_name ?? "–"} · {formatDay(r.reviewed_at)} {formatTime(r.reviewed_at)}</td>
                  <td className="px-3 py-3 font-mono text-xs">{cert?.serial ?? "–"}</td>
                  <td className="px-5 py-3 text-right">
                    <RevokeButton completionId={r.id} missionId={a.mission_id} name={a.profiles.display_name} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
