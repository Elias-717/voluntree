"use client";

// Live updates by polling (FR-011, allowed for the Oct 29 build): re-reads the page's server data every
// few seconds. Skips while the tab is hidden or someone is typing, so forms are never disturbed.

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AutoRefresh({ seconds = 5 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => {
      const typing = document.activeElement?.matches("input, textarea, select");
      if (!document.hidden && !typing) router.refresh();
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);
  return null;
}
