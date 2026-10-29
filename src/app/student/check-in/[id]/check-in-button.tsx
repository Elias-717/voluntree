"use client";

import { useState, useTransition } from "react";
import { checkIn } from "../../actions";

export function CheckInButton({ missionId, code }: { missionId: string; code: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      {error && <p role="alert" className="mb-3 text-sm text-brown">{error}</p>}
      <button
        onClick={() => startTransition(async () => setError(await checkIn(missionId, code)))}
        disabled={pending}
        className="w-full rounded-full bg-primary py-4 font-medium text-on-primary disabled:opacity-60"
      >
        {pending ? "Checking in…" : "I'm here"}
      </button>
    </>
  );
}
