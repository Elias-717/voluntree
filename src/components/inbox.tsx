// Inbox for students, organizers and admins (FR-012, DEC-058). New ones are highlighted on this visit;
// opening the inbox marks them read, so the bell's count clears.

import Link from "next/link";
import { Bell, CaretRight } from "@phosphor-icons/react/ssr";
import type { Notification } from "@/lib/db/notifications";
import { formatDayTime } from "@/lib/format";
import { MarkRead } from "./mark-read";

export function Inbox({ notifications }: { notifications: Notification[] }) {
  const unread = notifications.filter((n) => !n.read_at).length;
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
      <p className="mt-1 text-sm text-muted">{unread > 0 ? `${unread} new` : "You're all caught up."}</p>
      {unread > 0 && <MarkRead />}

      {notifications.length === 0 ? (
        <p className="mt-6 flex items-center gap-3 rounded-[18px] border border-line bg-card p-5 text-sm text-muted">
          <Bell size={20} aria-hidden /> Nothing yet. Updates about your missions will appear here.
        </p>
      ) : (
        <ul className="stagger mt-5 flex flex-col gap-2">
          {notifications.map((n) => {
            const content = (
              <>
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read_at ? "bg-transparent" : "bg-primary"}`} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className={`block ${n.read_at ? "font-medium" : "font-semibold"}`}>{n.title}</span>
                  {n.body && <span className="mt-0.5 block text-sm text-muted">{n.body}</span>}
                  <span className="mt-1 block text-xs text-muted">{formatDayTime(n.created_at)}</span>
                </span>
                {n.link && <CaretRight size={18} className="mt-1 shrink-0 text-muted" aria-hidden />}
              </>
            );
            const box = `flex items-start gap-3 rounded-[18px] border p-4 ${n.read_at ? "border-line bg-card" : "border-primary/40 bg-tint/60"}`;
            return (
              <li key={n.id}>
                {n.link ? <Link href={n.link} className={box}>{content}</Link> : <div className={box}>{content}</div>}
                {!n.read_at && <span className="sr-only">New</span>}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
