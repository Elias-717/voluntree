// Screen 4: student home. The watering gauge (DEC-037) and the top recommendations (FR-007).

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, MagnifyingGlass } from "@phosphor-icons/react/ssr";
import { Gauge, stageName } from "@/components/gauge";
import { GrowthCelebration } from "@/components/growth-celebration";
import { WateringDrop } from "@/components/watering-drop";
import { getTreeStage, TREE_STAGES } from "@/lib/tree/tree";
import { MissionIcon } from "@/components/mission-icon";
import { loadMissionCards, openTo } from "@/lib/db/recommend";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";
import { loadWaterings } from "@/lib/db/student";
import { formatDayTime } from "@/lib/format";

export default async function StudentHome() {
  const me = await requireRole("student");
  // First visit, or the notice changed: onboarding comes first (FR-025).
  if (!me.consentVersion) redirect("/student/welcome");

  const supabase = await createClient();
  const [waterings, { student, recommended }, { data: latest }] = await Promise.all([
    loadWaterings(supabase, me.id),
    loadMissionCards(supabase, me.id, me.displayName),
    supabase
      .from("completions")
      .select("reviewed_at, mission_assignments!inner(student_id, missions(title))")
      .eq("status", "APPROVED")
      .eq("mission_assignments.student_id", me.id)
      .order("reviewed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const forYou = recommended.slice(0, 2);
  const tree = getTreeStage(waterings);
  const latestMission = (latest as unknown as { mission_assignments: { missions: { title: string } } } | null)
    ?.mission_assignments.missions.title ?? null;

  return (
    <>
      <GrowthCelebration
        studentId={me.id}
        stageIndex={TREE_STAGES.indexOf(tree.stage)}
        stageName={stageName(waterings)}
        imagePath={tree.imagePath}
        waterings={waterings}
        latestMission={latestMission}
      />
      <h1 className="text-center font-semibold">Hi, {me.displayName.split(" ")[0]}</h1>
      <div className="relative mt-4">
        <Gauge waterings={waterings} />
        <WateringDrop studentId={me.id} waterings={waterings} />
      </div>

      <Link href="/student/find" className="mt-6 flex items-center justify-center gap-2 rounded-full bg-tint py-4 font-medium text-on-tint">
        <MagnifyingGlass size={20} aria-hidden /> Find a mission
      </Link>

      <div className="mt-8 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold tracking-tight">For you</h2>
        <Link href="/student/find" className="text-sm font-medium text-muted">See all</Link>
      </div>

      {student.matchingOptOut ? (
        <p className="mt-3 rounded-[18px] border border-line bg-card p-4 text-sm text-muted">
          Suggestions are off. You can still browse every mission you can join, or turn suggestions on in Me.
        </p>
      ) : forYou.length === 0 ? (
        <p className="mt-3 rounded-[18px] border border-line bg-card p-4 text-sm text-muted">
          Nothing matches right now. New missions appear here as organizers publish them.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {forYou.map(({ row, spotsLeft }) => (
            <li key={row.id}>
              <Link href={`/student/mission/${row.id}`} className="block rounded-[22px] border border-line bg-card p-4">
                <div className="flex items-start gap-3">
                  <MissionIcon title={row.title} />
                  <div className="flex-1">
                    <p className="font-semibold leading-snug">{row.title}</p>
                    <p className="text-sm text-muted">{formatDayTime(row.starts_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold leading-none">{spotsLeft}</p>
                    <p className="text-xs font-medium text-brown">spots left</p>
                  </div>
                </div>
                <div className="mt-4 flex items-end gap-4 text-sm">
                  <Fact label="Place" value={row.place} />
                  <Fact label="Skill" value={row.required_skills[0] ?? "Any"} />
                  <Fact label="Open to" value={openTo(row)} />
                  <span className="ml-auto grid size-11 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
                    <ArrowRight size={20} aria-hidden />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted">{label}</p>
      <p className="truncate font-medium capitalize">{value}</p>
    </div>
  );
}
