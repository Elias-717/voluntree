"use client";

// Landing live demo (FR-001, DEC-026): water a sandbox tree and watch it grow,
// using the same gauge and stage rules as the student home (FR-027, DEC-006).
// Nothing is saved. Real waterings come only from organizer-approved attendance.

import { useState } from "react";
import { ArrowCounterClockwise, Drop } from "@phosphor-icons/react";
import { Gauge } from "@/components/gauge";
import { TREE_STAGES, WATERINGS_PER_STAGE } from "@/lib/tree/tree";

const FULL = (TREE_STAGES.length - 1) * WATERINGS_PER_STAGE;

export function WaterDemo() {
  const [waterings, setWaterings] = useState(0);
  const full = waterings >= FULL;

  return (
    <div className="rounded-[28px] border border-line bg-card p-6 sm:p-8">
      <div key={Math.min(Math.floor(waterings / WATERINGS_PER_STAGE), TREE_STAGES.length - 1)} className="animate-[grow_.6s_cubic-bezier(.2,.8,.2,1)] motion-reduce:animate-none">
        <Gauge waterings={waterings} />
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => setWaterings((w) => w + 1)} disabled={full}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-medium text-on-primary transition active:scale-95 disabled:opacity-50">
          <Drop size={18} weight="fill" aria-hidden /> Approve attendance
        </button>
        <button type="button" onClick={() => setWaterings(0)} disabled={waterings === 0}
          className="inline-flex items-center gap-2 rounded-full border border-strong px-5 py-3.5 font-medium disabled:opacity-40">
          <ArrowCounterClockwise size={18} aria-hidden /> Reset
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-muted" aria-live="polite">
        {waterings === 0 ? "Each approval adds one watering." : `${waterings} ${waterings === 1 ? "watering" : "waterings"} so far. Sandbox only, nothing is saved.`}
      </p>
    </div>
  );
}
