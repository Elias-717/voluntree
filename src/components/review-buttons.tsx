"use client";

import { useState, useTransition } from "react";
import { Check, X } from "@phosphor-icons/react";
import { markAbsent, markPresent, revokeApproval } from "@/lib/actions/staff";

export function ReviewButtons({ assignmentId, missionId }: { assignmentId: string; missionId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: typeof markPresent) =>
    startTransition(async () => setError(await fn(assignmentId, missionId)));

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <div className="inline-flex gap-2">
        <button onClick={() => run(markPresent)} disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-medium text-on-primary disabled:opacity-60">
          <Check size={16} aria-hidden /> Present
        </button>
        <button onClick={() => run(markAbsent)} disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full border border-strong px-4 py-2 font-medium disabled:opacity-60">
          <X size={16} aria-hidden /> Absent
        </button>
      </div>
      {error && <p role="alert" className="text-xs text-brown">{error}</p>}
    </div>
  );
}

export function RevokeButton({ completionId, missionId, name }: { completionId: string; missionId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-full border border-strong px-4 py-2 text-sm font-medium">
        Revoke
      </button>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const message = await revokeApproval(completionId, missionId, reason);
          setError(message);
          if (!message) setOpen(false);
        });
      }}
      className="inline-flex flex-col items-end gap-1.5"
    >
      <label className="sr-only" htmlFor={`reason-${completionId}`}>Reason for revoking {name}</label>
      <input id={`reason-${completionId}`} value={reason} onChange={(e) => setReason(e.target.value)} required autoFocus
        placeholder="Reason (logged)" className="w-56 rounded-[12px] border border-line bg-page px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-line px-3 py-1.5 text-xs font-medium">Cancel</button>
        <button disabled={pending} className="rounded-full bg-brown px-3 py-1.5 text-xs font-medium text-card disabled:opacity-60">
          {pending ? "Revoking…" : "Revoke approval"}
        </button>
      </div>
      {error && <p role="alert" className="text-xs text-brown">{error}</p>}
    </form>
  );
}
