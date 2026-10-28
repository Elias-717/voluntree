// Screens 6 and 6b: my missions, upcoming and past, with an empty state.

import Link from "next/link";
import { CalendarBlank, Check, Drop, GraduationCap, Hourglass, MagnifyingGlass, X } from "@phosphor-icons/react/ssr";
import { MissionIcon } from "@/components/mission-icon";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";
import { formatDay, formatDayTime } from "@/lib/format";

type Row = {
  id: string;
  status: "PENDING_DEAN_APPROVAL" | "ACCEPTED" | "DEAN_REJECTED";
  missions: { id: string; title: string; starts_at: string; ends_at: string };
  completions: { status: "APPROVED" | "REJECTED" | "REVOKED" } | { status: "APPROVED" | "REJECTED" | "REVOKED" }[] | null;
};

const BADGES = {
  dean: { text: "Waiting for dean", Icon: GraduationCap, brown: true },
  in: { text: "You're in", Icon: Check, brown: false },
  checking: { text: "Being checked", Icon: Hourglass, brown: false },
  watered: { text: "+1 watering", Icon: Drop, brown: false },
  notConfirmed: { text: "Attendance not confirmed", Icon: X, brown: true },
  revoked: { text: "Approval revoked", Icon: X, brown: true },
  deanNo: { text: "Dean said no", Icon: X, brown: true },
} as const;

export default async function MyMissions({ searchParams }: PageProps<"/student/missions">) {
  const me = await requireRole("student");
  const { tab, joined } = await searchParams;
  const past = tab === "past";
  const supabase = await createClient();
  const { data } = await supabase
    .from("mission_assignments")
    .select("id, status, missions(id, title, starts_at, ends_at), completions(status)")
    .eq("student_id", me.id);

  const now = new Date().toISOString();
  const items = ((data ?? []) as unknown as Row[]).map((a) => {
    const completion = Array.isArray(a.completions) ? a.completions[0] : a.completions;
    const ended = a.missions.ends_at <= now;
    let badge: keyof typeof BADGES;
    if (a.status === "DEAN_REJECTED") badge = "deanNo";
    else if (completion?.status === "APPROVED") badge = "watered";
    else if (completion?.status === "REVOKED") badge = "revoked";
    else if (completion?.status === "REJECTED") badge = "notConfirmed";
    else if (a.status === "PENDING_DEAN_APPROVAL") badge = "dean";
    else badge = ended ? "checking" : "in";
    const finished = badge === "watered" || badge === "revoked" || badge === "notConfirmed" || badge === "deanNo";
    return { ...a, badge, finished };
  });

  const shown = items
    .filter((i) => i.finished === past)
    .sort((a, b) => (past ? b.missions.starts_at.localeCompare(a.missions.starts_at) : a.missions.starts_at.localeCompare(b.missions.starts_at)));

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="size-11" />
        <h1 className="font-semibold">My missions</h1>
        <span className="grid size-11 place-items-center rounded-full border border-line bg-card" aria-hidden>
          <CalendarBlank size={20} />
        </span>
      </div>

      <nav className="mt-5 grid grid-cols-2 rounded-full bg-tint p-1 text-center text-sm font-medium" aria-label="Tabs">
        <Link href="/student/missions" aria-current={!past ? "page" : undefined} className={`rounded-full py-2.5 ${!past ? "bg-card" : ""}`}>Upcoming</Link>
        <Link href="/student/missions?tab=past" aria-current={past ? "page" : undefined} className={`rounded-full py-2.5 ${past ? "bg-card" : ""}`}>Past</Link>
      </nav>

      {joined && !past && (
        <p role="status" className="mt-4 rounded-[18px] bg-tint p-3 text-sm font-medium text-on-tint">Done! The mission is in your list.</p>
      )}

      {shown.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-tint text-on-tint">
            <MagnifyingGlass size={34} aria-hidden />
          </span>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight">{past ? "Nothing here yet" : "No missions yet"}</h2>
          <p className="mt-1 text-muted">Find your first one and start growing.</p>
          <Link href="/student/find" className="mt-6 rounded-full bg-primary px-10 py-4 font-medium text-on-primary">Find a mission</Link>
        </div>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {shown.map((item) => {
            const b = BADGES[item.badge];
            return (
              <li key={item.id}>
                <Link href={`/student/mission/${item.missions.id}`} className="flex items-center gap-3 rounded-[22px] border border-line bg-card p-4">
                  <MissionIcon title={item.missions.title} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug">{item.missions.title}</p>
                    <p className="text-sm text-muted">{past ? formatDay(item.missions.starts_at) : formatDayTime(item.missions.starts_at)}</p>
                    <span className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${b.brown ? "bg-brown-tint text-brown" : "bg-tint text-on-tint"}`}>
                      <b.Icon size={13} aria-hidden /> {b.text}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
