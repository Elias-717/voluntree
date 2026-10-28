// Screen 9: organizer's missions, with counters for what needs attention.

import Link from "next/link";
import { Plus } from "@phosphor-icons/react/ssr";
import { MissionTable } from "@/components/mission-table";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";
import { loadStaffMissions, myOrganizationIds } from "@/lib/db/staff";

export default async function OrganizerHome() {
  const me = await requireRole("organizer");
  const supabase = await createClient();
  const missions = await loadStaffMissions(supabase, await myOrganizationIds(supabase, me.id));
  const toReview = missions.reduce((n, m) => n + m.toReview, 0);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">My missions</h1>
          <p className="text-sm text-muted">Updates every few seconds</p>
        </div>
        <Link href="/organizer/new" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-medium text-on-primary">
          <Plus size={18} aria-hidden /> New mission
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Counter label="To review" value={toReview} sub={missions.find((m) => m.toReview > 0)?.title ?? "All caught up"} />
        <Counter label="Published" value={missions.filter((m) => m.status === "PUBLISHED").length} sub="Open to students" />
        <Counter label="Drafts" value={missions.filter((m) => m.status === "DRAFT").length} sub="Not visible to students" />
      </div>

      <div className="mt-6">
        <MissionTable missions={missions} base="/organizer" />
      </div>
    </>
  );
}

function Counter({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="rounded-[22px] border border-line bg-card p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-4xl font-semibold tracking-[-0.03em]">{value}</p>
      <p className="mt-1 truncate text-xs text-muted">{sub}</p>
    </div>
  );
}
