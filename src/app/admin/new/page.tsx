// Screen 12: admin mission form with eligibility criteria (FR-029). Criteria lock after the first acceptance.

import { MissionForm } from "@/components/mission-form";
import { loadDraft } from "@/lib/db/mission-draft";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";

export default async function AdminNewMission({ searchParams }: PageProps<"/admin/new">) {
  await requireRole("admin");
  const { id } = await searchParams;
  const supabase = await createClient();
  const [{ draft, locked }, { data: organizations }] = await Promise.all([
    loadDraft(supabase, typeof id === "string" ? id : undefined),
    supabase.from("organizations").select("id, name, organization_members(profiles(deactivated_at))").order("name"),
  ]);
  // Only organizations with an active member; the test organization's logins are deactivated (DEC-044).
  const active = ((organizations ?? []) as unknown as {
    id: string;
    name: string;
    organization_members: { profiles: { deactivated_at: string | null } | null }[];
  }[]).filter((o) => o.organization_members.some((m) => m.profiles && !m.profiles.deactivated_at));

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-[-0.03em]">{draft ? "Edit draft" : "New mission"}</h1>
      <p className="mb-6 text-sm text-muted">Criteria lock once a student accepts.</p>
      <MissionForm admin draft={draft} organizations={active.map(({ id: orgId, name }) => ({ id: orgId, name }))} criteriaLocked={locked} />
    </>
  );
}
