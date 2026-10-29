// Screens 11 and 14: one mission's students and their attendance. Present approves (one watering
// and one certificate, exactly once); absent rejects. Admins can also revoke with a reason (FR-010).
// Attendance opens when the mission starts (DEC-052). QR check-in shows who is here; staff still approve.

import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, GraduationCap, Hourglass, PencilSimple, Phone, QrCode, X } from "@phosphor-icons/react/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { formatDayTime, formatTime } from "@/lib/format";
import { MISSION_COLUMNS, type MissionRow } from "@/lib/db/student";
import { CancelButton } from "./cancel-button";
import { CheckInPanel } from "./check-in-panel";
import { MarkAllPresentButton, ReviewButtons, RevokeButton } from "./review-buttons";

type RosterRow = {
  id: string;
  status: "PENDING_DEAN_APPROVAL" | "ACCEPTED" | "DEAN_REJECTED";
  applied_at: string;
  student_id: string;
  profiles: { display_name: string };
  completions: Completion | Completion[] | null;
  check_ins: CheckIn | CheckIn[] | null;
};
type CheckIn = { checked_in_at: string };
type Completion = { id: string; status: "APPROVED" | "REJECTED" | "REVOKED" };

export async function AttendanceReview({ supabase, missionId, admin }: { supabase: SupabaseClient; missionId: string; admin: boolean }) {
  const { data: mission } = await supabase.from("missions").select(MISSION_COLUMNS).eq("id", missionId).maybeSingle();
  if (!mission) notFound();
  const m = mission as MissionRow;

  const [{ data: roster }, { data: contacts }] = await Promise.all([
    supabase
      .from("mission_assignments")
      .select("id, status, applied_at, student_id, profiles!mission_assignments_student_id_fkey(display_name), completions(id, status), check_ins(checked_in_at)")
      .eq("mission_id", missionId)
      .order("applied_at"),
    supabase.rpc("mission_contacts", { p_mission_id: missionId }),
  ]);
  const phoneOf = new Map(((contacts ?? []) as { student_id: string; phone: string | null }[]).map((c) => [c.student_id, c.phone]));
  const rows = (roster ?? []) as unknown as RosterRow[];
  const now = new Date();
  const started = new Date(m.starts_at) <= now;
  // Same window as open_check_in: from 1 hour before the start until the end.
  const checkInOpen = m.status === "PUBLISHED" && now.getTime() >= new Date(m.starts_at).getTime() - 3_600_000 && now <= new Date(m.ends_at);
  const held = rows.filter((r) => r.status !== "DEAN_REJECTED").length;
  const confirmed = rows.filter((r) => r.status === "ACCEPTED").length;
  const waiting = rows.filter((r) => r.status === "ACCEPTED" && !completionOf(r)).length;
  const checkedIn = rows.filter((r) => checkInOf(r)).length;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">{m.title}</h1>
        <div className="flex flex-wrap items-start gap-2">
          {checkInOpen && <CheckInPanel missionId={m.id} title={m.title} checkedIn={checkedIn} confirmed={confirmed} />}
          {/* Published missions can be edited until they start (DEC-057). */}
          {m.status === "PUBLISHED" && !started && (
            <Link href={`${admin ? "/admin" : "/organizer"}/new?id=${m.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-strong px-4 py-2 text-sm font-medium">
              <PencilSimple size={18} aria-hidden /> Edit
            </Link>
          )}
          {m.status === "PUBLISHED" && <CancelButton missionId={m.id} draft={false} />}
        </div>
      </div>
      {m.status === "CANCELLED" && <p className="mt-2 text-sm font-medium text-brown">This mission was cancelled.</p>}
      <p className="text-sm text-muted">
        {formatDayTime(m.starts_at)} to {formatTime(m.ends_at)} · {m.place} · {held} of {m.capacity} accepted
        {checkedIn > 0 && ` · ${checkedIn} checked in`}
      </p>
      {!started && (
        <p className="mt-4 rounded-[14px] bg-tint p-3 text-sm text-on-tint">
          Attendance opens when the mission starts. {waiting > 0 ? `${waiting} confirmed so far.` : ""}
        </p>
      )}
      {started && waiting > 0 && (
        <div className="mt-4 flex justify-end">
          <MarkAllPresentButton missionId={m.id} count={waiting} />
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-[22px] border border-line bg-card">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted">
            <tr className="border-b border-line">
              <th className="px-5 py-3 font-medium">Student</th>
              <th className="px-3 py-3 font-medium">Joined</th>
              <th className="px-3 py-3 font-medium">Attendance</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="stagger divide-y divide-line">
            {rows.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-6 text-muted">No students have joined yet.</td></tr>
            )}
            {rows.map((r) => {
              const completion = completionOf(r);
              const phone = phoneOf.get(r.student_id);
              return (
                <tr key={r.id}>
                  <td className="px-5 py-3">
                    <p className="font-semibold">{r.profiles.display_name}</p>
                    {phone && (
                      <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="inline-flex items-center gap-1 text-xs text-muted">
                        <Phone size={12} aria-hidden /> {phone}
                      </a>
                    )}
                  </td>
                  <td className="px-3 py-3">{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Kuala_Lumpur" }).format(new Date(r.applied_at))}</td>
                  <td className="px-3 py-3">
                    <StatusTag row={r} completion={completion} started={started} />
                    {checkInOf(r) && (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted">
                        <QrCode size={12} aria-hidden /> Checked in {formatTime(checkInOf(r)!.checked_in_at)}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {r.status === "ACCEPTED" && started && !completion && <ReviewButtons assignmentId={r.id} missionId={m.id} />}
                    {completion?.status === "APPROVED" && (
                      admin ? <RevokeButton completionId={completion.id} missionId={m.id} name={r.profiles.display_name} />
                        : <span className="text-xs text-muted">Approving again changes nothing</span>
                    )}
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

function completionOf(r: RosterRow) {
  return Array.isArray(r.completions) ? r.completions[0] ?? null : r.completions;
}

function checkInOf(r: RosterRow) {
  return Array.isArray(r.check_ins) ? r.check_ins[0] ?? null : r.check_ins;
}

function StatusTag({ row, completion, started }: { row: RosterRow; completion: Completion | null; started: boolean }) {
  const tag = (text: string, Icon: typeof Check, brown: boolean) => (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${brown ? "bg-brown-tint text-brown" : "bg-tint text-on-tint"}`}>
      <Icon size={12} aria-hidden /> {text}
    </span>
  );
  if (row.status === "PENDING_DEAN_APPROVAL") return tag("Waiting for dean", GraduationCap, true);
  if (row.status === "DEAN_REJECTED") return tag("Dean said no", X, true);
  if (completion?.status === "APPROVED") return tag("Approved · certificate issued", Check, false);
  if (completion?.status === "REJECTED") return tag("Absent", X, true);
  if (completion?.status === "REVOKED") return tag("Revoked", X, true);
  return started ? tag("Waiting for review", Hourglass, true) : tag("Confirmed", Check, false);
}
