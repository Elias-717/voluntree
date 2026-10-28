"use client";

// Cancel a mission or discard a draft (DEC-047), with a confirmation step.

import { useState, useTransition } from "react";
import { cancelMission } from "@/lib/actions/staff";

export function CancelButton({ missionId, draft }: { missionId: string; draft: boolean }) {
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const label = draft ? "Discard draft" : "Cancel mission";

  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className="rounded-full border border-strong px-4 py-2 text-sm font-medium">
        {label}
      </button>
    );
  }
  return (
    <div className="flex flex-col items-end gap-1.5 text-sm" role="group" aria-label={label}>
      <p className="text-muted">
        {draft ? "Discard this draft?" : "Cancel for everyone? Students who joined lose nothing and get their time back."}
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={() => setAsking(false)} className="rounded-full border border-line px-3 py-1.5 font-medium">Keep it</button>
        <button type="button" disabled={pending} autoFocus
          onClick={() => startTransition(async () => setError(await cancelMission(missionId)))}
          className="rounded-full bg-brown px-3 py-1.5 font-medium text-card disabled:opacity-60">
          {pending ? "Cancelling…" : label}
        </button>
      </div>
      {error && <p role="alert" className="text-brown">{error}</p>}
    </div>
  );
}
