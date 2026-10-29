// Screen 12: admin mission form with eligibility criteria (FR-029). Criteria lock after the first acceptance.
// Also edits drafts and published missions with ?id= (DEC-057).

import Link from "next/link";
import { CancelButton } from "@/components/cancel-button";
import { MissionForm } from "@/components/mission-form";
import { loadDraft } from "@/lib/db/mission-draft";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";

export default async function AdminNewMission({ searchParams }: PageProps<"/admin/new">) {
  await requireRole("admin");
  const { id } = await searchParams;
  const supabase = await createClient();
  const [{ draft, locked, held, published, started }, { data: organizations }] = await Promise.all([
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">{published ? "Edit mission" : draft ? "Edit draft" : "New mission"}</h1>
        {draft?.id && !published && <CancelButton missionId={draft.id} draft />}
      </div>
      <p className="mb-6 text-sm text-muted">Criteria lock once a student accepts.</p>
      {published && started ? (
        <p className="rounded-[18px] border border-line bg-card p-5 text-sm text-muted">
          This mission has started, so it can&apos;t be edited any more.{" "}
          <Link href={`/admin/mission/${draft?.id}`} className="font-medium text-text underline">Back to the mission</Link>
        </p>
      ) : (
        <MissionForm admin draft={draft} organizations={active.map(({ id: orgId, name }) => ({ id: orgId, name }))}
          criteriaLocked={locked} published={published} held={held} />
      )}
    </>
  );
}
