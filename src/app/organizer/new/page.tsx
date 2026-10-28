// Screen 10: new mission (or editing a draft with ?id=). Manual form; the AI draft is Phase 4.

import { MissionForm } from "@/components/mission-form";
import { loadDraft } from "@/lib/db/mission-draft";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";

export default async function NewMission({ searchParams }: PageProps<"/organizer/new">) {
  await requireRole("organizer");
  const { id } = await searchParams;
  const supabase = await createClient();
  const { draft } = await loadDraft(supabase, typeof id === "string" ? id : undefined);

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-[-0.03em]">{draft ? "Edit draft" : "New mission"}</h1>
      <p className="mb-6 text-sm text-muted">Students see it once you publish. Nothing is published automatically.</p>
      <MissionForm admin={false} draft={draft} />
    </>
  );
}
