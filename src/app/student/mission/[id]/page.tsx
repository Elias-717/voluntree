// Screen 5: one mission, with "Why recommended" (FR-007) and the I'm in button (FR-006).

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarBlank, Clock, GraduationCap, MapPin } from "@phosphor-icons/react/ssr";
import { MissionIcon } from "@/components/mission-icon";
import { recommendMissionsForStudent } from "@/lib/matching/matching";
import { openTo } from "@/lib/db/recommend";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";
import { loadSpotsHeld, loadStudent, MISSION_COLUMNS, toMission, type MissionRow } from "@/lib/db/student";
import { formatDay, formatTime } from "@/lib/format";
import { AcceptButton } from "./accept-button";

const STATUS_TEXT = {
  ACCEPTED: "You're in. See you there!",
  PENDING_DEAN_APPROVAL: "You asked to join. Waiting for the dean.",
  DEAN_REJECTED: "The dean didn't approve this one.",
} as const;

export default async function MissionPage({ params }: PageProps<"/student/mission/[id]">) {
  const { id } = await params;
  const me = await requireRole("student");
  const supabase = await createClient();

  const { data } = await supabase.from("missions").select(MISSION_COLUMNS).eq("id", id).maybeSingle();
  if (!data) notFound();
  const row = data as MissionRow;

  const [student, held] = await Promise.all([loadStudent(supabase, me.id, me.displayName), loadSpotsHeld(supabase)]);
  const spotsLeft = Math.max(0, row.capacity - (held.get(row.id) ?? 0));
  const mine = student.commitments.find((c) => c.missionId === row.id);
  const upcoming = new Date(row.starts_at) > new Date() && row.status === "PUBLISHED";
  const recommendation = upcoming
    ? recommendMissionsForStudent(student, [toMission(row, held.get(row.id) ?? 0)])[0] ?? null
    : null;
  const confirmFirst = recommendation ? recommendation.availability !== "FULL" : true;

  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-5">
      <div className="flex items-center justify-between">
        <Link href="/student/find" aria-label="Back" className="grid size-11 place-items-center rounded-full border border-line bg-card">
          <ArrowLeft size={20} />
        </Link>
        <p className="font-semibold">Mission</p>
        <span className="size-11" />
      </div>

      <div className="mt-5 grid h-44 place-items-center rounded-[28px] bg-tint">
        <MissionIcon title={row.title} size="lg" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {row.eligible_schools.length > 0 && <Tag>{openTo(row)}</Tag>}
        {row.min_cgpa !== null && <Tag>CGPA {Number(row.min_cgpa).toFixed(2)}+</Tag>}
        {row.dean_approval_required && <Tag brown>Dean approval</Tag>}
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{row.title}</h1>
      <p className="mt-1 text-muted">{row.description}</p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm font-semibold">
        <Fact Icon={CalendarBlank} text={formatDay(row.starts_at)} />
        <Fact Icon={Clock} text={`${formatTime(row.starts_at)} to ${formatTime(row.ends_at)}`} />
        <Fact Icon={MapPin} text={row.place} />
      </div>

      {row.dean_approval_required && (
        <p className="mt-3 flex items-center gap-3 rounded-[18px] border border-line bg-card p-3 text-sm text-muted">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brown-tint text-brown">
            <GraduationCap size={18} aria-hidden />
          </span>
          A dean says OK first. We will let you know.
        </p>
      )}
      {row.safety_notes && <p className="mt-3 text-sm text-muted">Safety: {row.safety_notes}</p>}

      {recommendation && (
        <section className="mt-5 rounded-[22px] border border-line bg-card p-4">
          <h2 className="font-semibold">Why recommended</h2>
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {recommendation.factors.map((f) => (
              <li key={f.name} className="flex items-start justify-between gap-3">
                <span className="text-muted">{f.explanation}</span>
                <span className="shrink-0 font-medium text-accent">{Math.round(f.weight * 100)}% weight</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Suggestions are advisory. You decide, and people make the final call.</p>
        </section>
      )}

      <div className="mt-auto pt-6">
        {row.status === "CANCELLED" ? (
          <p className="rounded-full bg-gauge-empty py-4 text-center font-medium text-muted">This mission was cancelled. Nothing is lost.</p>
        ) : mine ? (
          <p className="rounded-full bg-tint py-4 text-center font-medium text-on-tint">
            {mine.status === "ACCEPTED" && new Date(row.ends_at) <= new Date()
              ? "Done. Your organizer is checking attendance."
              : STATUS_TEXT[mine.status]}
          </p>
        ) : !upcoming ? (
          <p className="rounded-full bg-gauge-empty py-4 text-center font-medium text-muted">This mission is closed</p>
        ) : (
          <>
            <p className="mb-3 text-center text-sm text-muted">
              {spotsLeft} of {row.capacity} spots left
            </p>
            <AcceptButton
              missionId={row.id}
              full={spotsLeft === 0}
              confirmFirst={confirmFirst}
              when={`${formatDay(row.starts_at)}, ${formatTime(row.starts_at)} to ${formatTime(row.ends_at)}`}
              place={row.place}
            />
          </>
        )}
      </div>
    </div>
  );
}

function Tag({ children, brown = false }: { children: React.ReactNode; brown?: boolean }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${brown ? "bg-brown-tint text-brown" : "bg-tint text-on-tint"}`}>
      {children}
    </span>
  );
}

function Fact({ Icon, text }: { Icon: typeof Clock; text: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-[18px] border border-line bg-card px-2 py-3">
      <Icon size={20} aria-hidden />
      {text}
    </div>
  );
}
