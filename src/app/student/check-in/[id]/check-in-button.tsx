"use client";

// Scanning the QR checks the student in by itself (DEC-059): opening this screen with a code records
// the check-in once, then the page shows "Checked in at". "I'm here" is only a retry if that fails
// (for example, an expired code). It runs in the browser after the page opens, never during a
// server render or link preview, so nothing checks in without the student's phone opening the link.

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { CircleNotch } from "@phosphor-icons/react";
import { checkIn } from "../../actions";

export function CheckInButton({ missionId, code }: { missionId: string; code: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const tried = useRef(false);

  const run = () =>
    startTransition(async () => {
      const message = await checkIn(missionId, code);
      setError(message);
      if (!message) router.refresh();
    });

  useEffect(() => {
    if (tried.current || !code) return;
    tried.current = true;
    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {error && <p role="alert" className="mb-3 text-sm text-brown">{error}</p>}
      <button
        onClick={run}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-medium text-on-primary disabled:opacity-60"
      >
        {pending && <CircleNotch size={18} className="animate-spin motion-reduce:animate-none" aria-hidden />}
        {pending ? "Checking you in…" : error ? "Try again" : "I'm here"}
      </button>
    </>
  );
}
