// Screen 4a: find a mission. Recommended missions first (FR-007), then every other mission the
// student can join (FR-025, FR-029: gated missions they are not eligible for never appear).

import Link from "next/link";
import { ArrowLeft, MagnifyingGlass } from "@phosphor-icons/react/ssr";
import { MissionIcon } from "@/components/mission-icon";
import { loadMissionCards, openTo } from "@/lib/db/recommend";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";
import { formatDayTime } from "@/lib/format";

export default async function FindMission({ searchParams }: PageProps<"/student/find">) {
  const me = await requireRole("student");
  const q = String((await searchParams).q ?? "").trim().toLowerCase();
  const supabase = await createClient();
  const { cards } = await loadMissionCards(supabase, me.id, me.displayName);
  const shown = q
    ? cards.filter(({ row }) => [row.title, row.place, ...row.required_skills].some((s) => s.toLowerCase().includes(q)))
    : cards;

  return (
    <>
      <div className="flex items-center justify-between">
        <Link href="/student" aria-label="Back" className="grid size-11 place-items-center rounded-full border border-line bg-card">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-semibold">Find a mission</h1>
        <span className="size-11" />
      </div>

      <form className="mt-5">
        <label className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-3.5 text-muted">
          <MagnifyingGlass size={20} aria-hidden />
          <span className="sr-only">Search missions</span>
          <input name="q" defaultValue={q} placeholder="Search missions" className="flex-1 bg-transparent text-text outline-none" />
        </label>
      </form>

      <h2 className="mt-6 text-xl font-semibold tracking-tight">{q ? "Results" : "Coming up"}</h2>
      {shown.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No missions found.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {shown.map(({ row, spotsLeft, recommendation }) => {
            const gated = row.eligible_schools.length > 0;
            return (
              <li key={row.id}>
                <Link href={`/student/mission/${row.id}`} className="flex items-center gap-3 rounded-[22px] border border-line bg-card p-4">
                  <MissionIcon title={row.title} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug">{row.title}</p>
                    <p className="truncate text-sm text-muted">{formatDayTime(row.starts_at)} · {row.place}</p>
                    {recommendation && <p className="mt-0.5 text-xs font-medium text-accent">Recommended for you</p>}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                    spotsLeft === 0 ? "bg-gauge-empty text-muted" : gated ? "bg-tint text-on-tint" : spotsLeft <= 3 ? "bg-brown-tint text-brown" : "bg-tint text-on-tint"}`}>
                    {spotsLeft === 0 ? "Full" : gated ? openTo(row) : `${spotsLeft} left`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
