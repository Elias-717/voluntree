"use client";

import { useOptimistic, useTransition } from "react";
import { setSuggestions } from "../../actions";

export function SuggestSwitch({ on }: { on: boolean }) {
  const [shown, setShown] = useOptimistic(on);
  const [, startTransition] = useTransition();

  return (
    <label className="mt-4 flex items-center justify-between rounded-[22px] border border-line bg-card px-4 py-4 font-medium">
      Suggest missions for me
      <input
        type="checkbox"
        checked={shown}
        onChange={(e) => {
          const next = e.target.checked;
          startTransition(async () => {
            setShown(next);
            await setSuggestions(next);
          });
        }}
        className="peer sr-only"
      />
      <span aria-hidden className="relative h-7 w-12 rounded-full bg-gauge-empty transition-colors peer-checked:bg-primary after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-card after:transition-transform peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-primary" />
    </label>
  );
}
