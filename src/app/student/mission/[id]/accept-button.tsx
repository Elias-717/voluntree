"use client";

// "I'm in": one tap. Students only accept missions they can attend (DEC-048), so there is no
// availability check; accept_mission still enforces eligibility, overlaps and capacity.

import { useState, useTransition } from "react";
import { acceptMission } from "../../actions";

interface Props {
  missionId: string;
  full: boolean;
}

export function AcceptButton({ missionId, full }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const accept = () =>
    startTransition(async () => {
      setError(null);
      const message = await acceptMission(missionId);
      if (message) setError(message);
    });

  return (
    <>
      {error && <p role="alert" className="mb-3 text-center text-sm text-brown">{error}</p>}
      <button
        disabled={full || pending}
        onClick={accept}
        className="w-full rounded-full bg-primary py-4 font-medium text-on-primary disabled:bg-gauge-empty disabled:text-muted"
      >
        {full ? "No spots left" : pending ? "Joining…" : "I'm in"}
      </button>
    </>
  );
}
