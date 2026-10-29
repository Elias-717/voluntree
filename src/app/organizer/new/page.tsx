// Screen 10: new mission, or editing a draft or a published mission with ?id= (DEC-057). Manual form; the AI draft is Phase 4.

import Link from "next/link";
import { CancelButton } from "@/components/cancel-button";
import { MissionForm } from "@/components/mission-form";
import { loadDraft } from "@/lib/db/mission-draft";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";

export default async function NewMission({ searchParams }: PageProps<"/organizer/new">) {
  await requireRole("organizer");
  const { id } = await searchParams;
  const supabase = await createClient();
  const { draft, held, published, started } = await loadDraft(supabase, typeof id === "string" ? id : undefined);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">{published ? "Edit mission" : draft ? "Edit draft" : "New mission"}</h1>
        {draft?.id && !published && <CancelButton missionId={draft.id} draft />}
      </div>
      <p className="mb-6 text-sm text-muted">Students see it once you publish. Nothing is published automatically.</p>
      {published && started ? (
        <p className="rounded-[18px] border border-line bg-card p-5 text-sm text-muted">
          This mission has started, so it can&apos;t be edited any more.{" "}
          <Link href={`/organizer/mission/${draft?.id}`} className="font-medium text-text underline">Back to the mission</Link>
        </p>
      ) : (
        <MissionForm admin={false} draft={draft} published={published} held={held} />
      )}
    </>
  );
}
