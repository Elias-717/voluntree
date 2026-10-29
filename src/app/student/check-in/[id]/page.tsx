// QR check-in (FR-016, DEC-052): the link inside the organizer's QR opens this screen.
// One tap records that the student is here; the organizer still approves attendance.

import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle, MapPin } from "@phosphor-icons/react/ssr";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";
import { formatDayTime, formatTime } from "@/lib/format";
import { CheckInButton } from "./check-in-button";

export default async function CheckIn({ params, searchParams }: PageProps<"/student/check-in/[id]">) {
  const { id } = await params;
  const code = String((await searchParams).c ?? "");
  const me = await requireRole("student");
  const supabase = await createClient();

  const { data: mission } = await supabase.from("missions").select("title, place, starts_at, ends_at").eq("id", id).maybeSingle();
  if (!mission) notFound();
  const { data: assignment } = await supabase
    .from("mission_assignments")
    .select("id, status, check_ins(checked_in_at)")
    .eq("mission_id", id)
    .eq("student_id", me.id)
    .maybeSingle();
  const checkIns = assignment?.check_ins as { checked_in_at: string } | { checked_in_at: string }[] | null | undefined;
  const checkedIn = Array.isArray(checkIns) ? checkIns[0] : checkIns;

  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-16 text-center">
      <p className="text-sm font-medium text-muted">Check in</p>
      <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.03em]">{mission.title}</h1>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-muted">
        <MapPin size={16} aria-hidden /> {mission.place} · {formatDayTime(mission.starts_at)} to {formatTime(mission.ends_at)}
      </p>

      <div className="mt-auto">
        {checkedIn ? (
          <p className="flex items-center justify-center gap-2 rounded-full bg-tint py-4 font-medium text-on-tint">
            <CheckCircle size={20} weight="fill" aria-hidden />
            Checked in at {formatTime(checkedIn.checked_in_at)}
          </p>
        ) : assignment?.status === "ACCEPTED" ? (
          <CheckInButton missionId={id} code={code} />
        ) : (
          <p className="rounded-full bg-gauge-empty py-4 font-medium text-muted">You aren&apos;t confirmed on this mission</p>
        )}
        <p className="mt-3 text-xs text-muted">Your organizer confirms attendance. Then your tree gets its watering.</p>
        <Link href="/student" className="mt-4 inline-block text-sm font-medium">Back home</Link>
      </div>
    </div>
  );
}
