"use client";

// Home gauge (DEC-053): when a new watering has arrived since the student last looked on this device,
// one drop falls into the tree and a ripple spreads. The count seen is kept on the device only.

import { useEffect, useSyncExternalStore } from "react";
import { readDevice, subscribeDevice, writeDevice } from "@/lib/device-store";
import { WaterDrop } from "./water-drop";

export function WateringDrop({ studentId, waterings }: { studentId: string; waterings: number }) {
  const key = `seen-waterings:${studentId}`;
  const saved = useSyncExternalStore(subscribeDevice, () => readDevice(key), () => "server");
  const seen = saved === null || saved === "server" ? null : Number(saved);
  const fresh = seen !== null && waterings > seen;

  // Remember the count after the drop has had time to fall (or straight away on a first visit).
  useEffect(() => {
    if (saved === "server" || seen === waterings) return;
    const timer = setTimeout(() => writeDevice(key, String(waterings)), fresh ? 2500 : 0);
    return () => clearTimeout(timer);
  }, [key, saved, seen, waterings, fresh]);

  if (!fresh) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <WaterDrop className="gauge-drop absolute top-[38%] w-6" />
      <span className="drop-ripple absolute top-[52%] size-28 rounded-full border-4 border-[#8fd3ff]" />
    </div>
  );
}
