// Next-stage watering gauge (DEC-037): one arc segment per watering needed for the next stage,
// filled up to the waterings earned within the current stage. A full tree shows every segment filled.

import Image from "next/image";
import { getTreeStage, WATERINGS_PER_STAGE } from "@/lib/tree/tree";

// The drawings are date palm stages (DEC-051); the labels follow them (DEC-053). Stage keys are unchanged.
const STAGE_NAMES: Record<string, string> = {
  seed: "Seed", sprout: "Sprout", sapling: "Sapling", "young-tree": "Young palm", "full-tree": "Date palm",
};
const NEXT: Record<string, string> = { seed: "Sprout", sprout: "Sapling", sapling: "Young palm", "young-tree": "Date palm" };

export function stageName(waterings: number) {
  return STAGE_NAMES[getTreeStage(waterings).stage];
}

export function Gauge({ waterings }: { waterings: number }) {
  const tree = getTreeStage(waterings);
  const full = tree.wateringsToNextStage === null;
  const earned = full ? WATERINGS_PER_STAGE : waterings % WATERINGS_PER_STAGE;

  // Segments sweep 240° over the top, leaving the bottom open.
  const sweep = 240;
  const gap = 10;
  const each = (sweep - gap * (WATERINGS_PER_STAGE - 1)) / WATERINGS_PER_STAGE;
  const segments = Array.from({ length: WATERINGS_PER_STAGE }, (_, i) => {
    const from = -120 + i * (each + gap);
    return arc(from, from + each);
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[300px]">
        <svg viewBox="0 0 200 170" className="w-full" role="img"
          aria-label={full ? "Date palm, fully grown" : `${earned} of ${WATERINGS_PER_STAGE} waterings to ${NEXT[tree.stage]}`}>
          {segments.map((d, i) => (
            <path key={i} d={d} fill="none" strokeWidth={14} strokeLinecap="round"
              className={i < earned ? "stroke-gauge-filled" : "stroke-gauge-empty"} />
          ))}
        </svg>
        <Image src={tree.imagePath} alt={stageName(waterings)} width={150} height={150} priority
          className="absolute left-1/2 top-[56%] h-auto w-[52%] -translate-x-1/2 -translate-y-1/2" />
      </div>
      {full ? (
        <>
          <p className="text-4xl font-semibold tracking-[-0.03em]">Date palm</p>
          <p className="mt-1 text-sm font-medium text-accent">{waterings} waterings · your tree is fully grown</p>
        </>
      ) : (
        <>
          <p className="text-4xl font-semibold tracking-[-0.03em]">{earned} of {WATERINGS_PER_STAGE}</p>
          <p className="mt-1 text-sm font-medium text-accent">
            waterings · {tree.wateringsToNextStage} more to {NEXT[tree.stage]}
          </p>
        </>
      )}
    </div>
  );
}

/** SVG arc on a circle of radius 80 centred at (100, 100); 0° points up. */
function arc(fromDeg: number, toDeg: number) {
  const point = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return `${(100 + 80 * Math.cos(rad)).toFixed(2)} ${(100 + 80 * Math.sin(rad)).toFixed(2)}`;
  };
  return `M ${point(fromDeg)} A 80 80 0 0 1 ${point(toDeg)}`;
}
