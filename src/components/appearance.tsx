"use client";

// Appearance setting (DEC-031): System follows the device; Light and Dark are saved on this device.

import { useSyncExternalStore } from "react";
import { applyTheme, readDevice, subscribeDevice } from "@/lib/device-store";

type Choice = "system" | "light" | "dark";

function currentChoice(): Choice {
  const saved = readDevice("theme");
  return saved === "light" || saved === "dark" ? saved : "system";
}

export function Appearance({ compact = false }: { compact?: boolean }) {
  const choice = useSyncExternalStore(subscribeDevice, currentChoice, () => "system" as Choice);

  return (
    <div role="radiogroup" aria-label="Appearance" className={`grid grid-cols-3 rounded-full bg-tint p-1 text-center font-medium ${compact ? "text-xs" : "text-sm"}`}>
      {(["system", "light", "dark"] as const).map((c) => (
        <button key={c} role="radio" aria-checked={choice === c} onClick={() => applyTheme(c)}
          className={`rounded-full capitalize ${compact ? "py-1.5" : "py-2.5"} ${choice === c ? "bg-card text-text" : "text-on-tint"}`}>
          {c}
        </button>
      ))}
    </div>
  );
}
