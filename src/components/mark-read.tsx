"use client";

// Marks the inbox read once it has been shown (DEC-058). The highlight stays until the next refresh.

import { useEffect } from "react";
import { markAllRead } from "@/lib/actions/notifications";

export function MarkRead() {
  useEffect(() => {
    const timer = setTimeout(() => markAllRead(), 1500);
    return () => clearTimeout(timer);
  }, []);
  return null;
}
