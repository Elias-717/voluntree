// Mission list for organizer (screen 9) and admin missions: status, spots, attendance to review.

import Link from "next/link";
import { Hourglass } from "@phosphor-icons/react/ssr";
import { MissionIcon } from "./mission-icon";
import type { StaffMission } from "@/lib/db/staff";
import { formatDayTime } from "@/lib/format";

export function MissionTable({ missions, base }: { missions: StaffMission[]; base: string }) {
  if (missions.length === 0) {
    return <p className="rounded-[22px] border border-line bg-card p-6 text-sm text-muted">No missions yet.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-[22px] border border-line bg-card">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-muted">
          <tr className="border-b border-line">
            <th className="px-5 py-3 font-medium">Mission</th>
            <th className="px-3 py-3 font-medium">Date</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3 font-medium">Accepted</th>
            <th className="px-3 py-3 font-medium">To review</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {missions.map((m) => {
            const draft = m.status === "DRAFT";
            return (
              <tr key={m.id}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <MissionIcon title={m.title ?? ""} />
                    <div>
                      <p className="font-semibold">{m.title ?? "Untitled mission"}</p>
                      <p className="text-xs text-muted">{m.place ?? "Missing place"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">{m.starts_at ? formatDayTime(m.starts_at) : <span className="text-muted">Not set</span>}</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${draft ? "bg-gauge-empty text-muted" : "bg-tint text-on-tint"}`}>
                    {m.status === "PUBLISHED" ? "Published" : m.status === "COMPLETED" ? "Completed" : "Draft"}
                  </span>
                </td>
                <td className="px-3 py-3">
                  {draft || !m.capacity ? <span className="text-muted">None</span> : (
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-gauge-empty">
                        <span className="block h-full bg-primary" style={{ width: `${Math.min(100, (m.held / m.capacity) * 100)}%` }} />
                      </span>
                      {m.held} / {m.capacity}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3">
                  {m.toReview > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brown-tint px-2.5 py-1 text-xs font-medium text-brown">
                      <Hourglass size={12} aria-hidden /> {m.toReview} to review
                    </span>
                  ) : <span className="text-muted">None</span>}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={draft ? `${base}/new?id=${m.id}` : `${base}/mission/${m.id}`}
                    className={`rounded-full px-4 py-2 font-medium ${m.toReview > 0 ? "bg-primary text-on-primary" : "border border-strong"}`}>
                    {draft ? "Edit" : m.toReview > 0 ? "Review" : "Open"}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
