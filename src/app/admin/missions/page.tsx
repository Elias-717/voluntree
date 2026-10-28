// Admin: every mission, from every organization.

import Link from "next/link";
import { Plus } from "@phosphor-icons/react/ssr";
import { MissionTable } from "@/components/mission-table";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";
import { loadStaffMissions } from "@/lib/db/staff";

export default async function AdminMissions() {
  await requireRole("admin");
  const supabase = await createClient();
  const missions = await loadStaffMissions(supabase);
  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">Missions</h1>
          <p className="text-sm text-muted">All organizations. Only admins set eligibility criteria.</p>
        </div>
        <Link href="/admin/new" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-medium text-on-primary">
          <Plus size={18} aria-hidden /> New mission
        </Link>
      </div>
      <MissionTable missions={missions} base="/admin" />
    </>
  );
}
