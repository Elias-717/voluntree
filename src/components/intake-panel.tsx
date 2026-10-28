"use client";

// "Draft from an announcement" (FR-023): paste text, the AI fills the form for a person to check.

import { useState, useTransition } from "react";
import { Sparkle } from "@phosphor-icons/react";
import { draftFromAnnouncement } from "@/lib/actions/staff";
import type { Draft } from "@/lib/intake/draft";

export function IntakePanel({ onDraft }: { onDraft: (draft: Draft, blanks: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      setError(null);
      const result = await draftFromAnnouncement(text);
      if ("error" in result) setError(result.error);
      else {
        onDraft(result.draft, result.blanks);
        setOpen(false);
      }
    });

  return (
    <div className="rounded-[18px] bg-tint p-4 text-on-tint">
      <div className="flex flex-wrap items-center gap-3">
        <Sparkle size={20} weight="fill" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Draft from an announcement</p>
          <p className="text-xs">Paste the text; AI fills the form for you to check. Nothing is published automatically.</p>
        </div>
        {!open && (
          <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-card px-4 py-2 text-sm font-medium text-text">
            Paste text
          </button>
        )}
      </div>
      {open && (
        <div className="mt-3 flex flex-col gap-2">
          <label className="sr-only" htmlFor="announcement">Announcement text</label>
          <textarea id="announcement" value={text} onChange={(e) => setText(e.target.value)} rows={5} autoFocus
            placeholder="Paste the event announcement here. Emails and phone numbers are removed before it is sent to the AI."
            className="w-full rounded-[12px] border border-line bg-card px-3 py-2.5 text-sm text-text" />
          {error && <p role="alert" className="text-sm text-brown">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-line px-4 py-2 text-sm font-medium">Cancel</button>
            <button type="button" onClick={run} disabled={pending}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-60">
              {pending ? "Drafting…" : "Draft with AI"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
