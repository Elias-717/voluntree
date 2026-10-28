"use client";

// "I'm in", with screen 5b's confirmation when the student hasn't said they're free for the whole
// mission (DEC-036). accept_mission itself never checks availability.

import Link from "next/link";
import { useState, useTransition } from "react";
import { CalendarBlank } from "@phosphor-icons/react";
import { acceptMission } from "../../actions";

interface Props {
  missionId: string;
  full: boolean;
  confirmFirst: boolean;
  when: string;
  place: string;
}

export function AcceptButton({ missionId, full, confirmFirst, when, place }: Props) {
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const accept = () =>
    startTransition(async () => {
      setError(null);
      const message = await acceptMission(missionId);
      if (message) {
        setError(message);
        setAsking(false);
      }
    });

  return (
    <>
      {error && <p role="alert" className="mb-3 text-center text-sm text-brown">{error}</p>}
      <button
        disabled={full || pending}
        onClick={() => (confirmFirst ? setAsking(true) : accept())}
        className="w-full rounded-full bg-primary py-4 font-medium text-on-primary disabled:bg-gauge-empty disabled:text-muted"
      >
        {full ? "No spots left" : pending ? "Joining…" : "I'm in"}
      </button>

      {asking && (
        <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/40" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="w-full max-w-md rounded-t-[28px] bg-card px-4 pb-8 pt-3 text-center">
            <span className="mx-auto block h-1 w-10 rounded-full bg-gauge-empty" />
            <span className="mx-auto mt-4 grid size-12 place-items-center rounded-full bg-tint text-on-tint">
              <CalendarBlank size={22} aria-hidden />
            </span>
            <h2 id="confirm-title" className="mt-3 text-xl font-semibold tracking-tight">
              Are you free for the
              <br />
              whole mission?
            </h2>
            <p className="mt-2 text-sm text-muted">
              {when}
              <br />
              {place}
            </p>
            <button onClick={accept} disabled={pending} autoFocus className="mt-5 w-full rounded-full bg-primary py-4 font-medium text-on-primary disabled:opacity-60">
              {pending ? "Joining…" : "Yes, I'm free"}
            </button>
            <button onClick={() => setAsking(false)} className="mt-3 w-full rounded-full border border-strong py-4 font-medium">
              Cancel
            </button>
            <Link href="/student/me" className="mt-4 inline-block text-sm font-medium">Set my availability</Link>
          </div>
        </div>
      )}
    </>
  );
}
