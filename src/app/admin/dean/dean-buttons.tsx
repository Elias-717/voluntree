"use client";

import { useState, useTransition } from "react";
import { Check, X } from "@phosphor-icons/react";
import { recordDeanDecision } from "@/lib/actions/staff";

export function DeanButtons({ assignmentId, name }: { assignmentId: string; name: string }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const decide = (approved: boolean) =>
    startTransition(async () => setError(await recordDeanDecision(assignmentId, approved, note)));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`note-${assignmentId}`}>Note for {name}</label>
        <input id={`note-${assignmentId}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)"
          className="w-36 rounded-[12px] border border-line bg-page px-3 py-2" />
        <button onClick={() => decide(true)} disabled={pending}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-4 py-2 font-medium text-on-primary disabled:opacity-60">
          <Check size={16} aria-hidden /> Dean approved
        </button>
        <button onClick={() => decide(false)} disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full border border-strong px-4 py-2 font-medium disabled:opacity-60">
          <X size={16} aria-hidden /> Declined
        </button>
      </div>
      {error && <p role="alert" className="text-xs text-brown">{error}</p>}
    </div>
  );
}
