// The bell with the unread count (FR-012, DEC-058). Rendered by layouts, so the 5-second refresh
// (FR-011) keeps the count live.

import Link from "next/link";
import { Bell } from "@phosphor-icons/react/ssr";

export function NotificationBell({ href, count, className = "" }: { href: string; count: number; className?: string }) {
  return (
    <Link href={href} aria-label={count > 0 ? `Inbox, ${count} new` : "Inbox"}
      className={`relative grid size-11 place-items-center rounded-full border border-line bg-card ${className}`}>
      <Bell size={20} weight={count > 0 ? "fill" : "regular"} aria-hidden />
      {count > 0 && (
        <span key={count} className="badge-pop absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-on-primary">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
