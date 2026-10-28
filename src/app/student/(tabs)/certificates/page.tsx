// Screen 8: certificates (FR-010). Revoked ones are listed but cannot be downloaded.

import { DownloadSimple, Medal, Prohibit } from "@phosphor-icons/react/ssr";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";
import { formatLongDate } from "@/lib/format";

type Row = {
  id: string;
  serial: string;
  status: "VALID" | "REVOKED";
  completions: { mission_assignments: { student_id: string; missions: { title: string; starts_at: string } } };
};

export default async function Certificates() {
  const me = await requireRole("student");
  const supabase = await createClient();
  const { data } = await supabase
    .from("certificates")
    .select("id, serial, status, completions!inner(mission_assignments!inner(student_id, missions(title, starts_at)))")
    .eq("completions.mission_assignments.student_id", me.id);

  const rows = ((data ?? []) as unknown as Row[]).sort((a, b) =>
    b.completions.mission_assignments.missions.starts_at.localeCompare(a.completions.mission_assignments.missions.starts_at),
  );
  const valid = rows.filter((r) => r.status === "VALID").length;

  return (
    <>
      <h1 className="text-center font-semibold">Certificates</h1>
      <div className="mt-5 flex items-center justify-between rounded-[22px] border border-line bg-card p-5">
        <div>
          <p className="text-sm text-muted">Earned so far</p>
          <p className="text-4xl font-semibold tracking-[-0.03em]">{valid}</p>
        </div>
        <span className="grid size-14 place-items-center rounded-full bg-tint text-on-tint">
          <Medal size={26} aria-hidden />
        </span>
      </div>

      {rows.length === 0 && (
        <p className="mt-4 text-center text-sm text-muted">Complete a mission to earn your first certificate.</p>
      )}
      <ul className="mt-4 flex flex-col gap-3">
        {rows.map((r) => {
          const mission = r.completions.mission_assignments.missions;
          const revoked = r.status === "REVOKED";
          return (
            <li key={r.id} className={`flex items-center gap-3 rounded-[22px] border border-line p-4 ${revoked ? "bg-transparent" : "bg-card"}`}>
              <span className={`grid size-11 shrink-0 place-items-center rounded-full ${revoked ? "bg-gauge-empty text-muted" : "bg-tint text-on-tint"}`}>
                {revoked ? <Prohibit size={20} aria-hidden /> : <Medal size={20} aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`font-semibold leading-snug ${revoked ? "text-muted" : ""}`}>{mission.title}</p>
                <p className="text-xs text-muted">
                  {revoked ? "Revoked · cannot be downloaded" : `${formatLongDate(mission.starts_at)} · ${r.serial}`}
                </p>
              </div>
              {revoked ? (
                <span className="rounded-full bg-brown-tint px-2.5 py-1 text-xs font-medium text-brown">Revoked</span>
              ) : (
                <a href={`/certificates/${r.id}`} aria-label={`Download certificate for ${mission.title}`}
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
                  <DownloadSimple size={20} />
                </a>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-5 text-center text-xs text-muted">Prototype certificates, not official AIU documents</p>
    </>
  );
}
