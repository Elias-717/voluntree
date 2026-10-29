"use client";

// QR check-in for organizers and admins (FR-016, DEC-052). "Start check-in" shows a QR that changes
// every minute; students scan it with their phone camera. Shown full screen so a room can scan it.

import { useEffect, useState, useTransition } from "react";
import { QrCode, X } from "@phosphor-icons/react";
import { checkInQr, openCheckIn } from "@/lib/actions/staff";

export function CheckInPanel({ missionId, title, checkedIn, confirmed }: { missionId: string; title: string; checkedIn: number; confirmed: number }) {
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState<{ svg: string; secondsLeft: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // While open, fetch the current QR every 10 seconds, so it changes within seconds of each new minute.
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const result = await checkInQr(missionId);
      if ("error" in result) setError(result.error);
      else setQr(result);
    };
    load();
    const timer = setInterval(load, 10_000);
    return () => clearInterval(timer);
  }, [open, missionId]);

  // Count down between fetches.
  useEffect(() => {
    if (!qr) return;
    const timer = setInterval(() => setQr((q) => (q && q.secondsLeft > 1 ? { ...q, secondsLeft: q.secondsLeft - 1 } : q)), 1000);
    return () => clearInterval(timer);
  }, [qr?.svg]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = () =>
    startTransition(async () => {
      setError(null);
      const message = await openCheckIn(missionId);
      if (message) setError(message);
      else setOpen(true);
    });

  return (
    <>
      <button onClick={start} disabled={pending}
        className="inline-flex items-center gap-2 rounded-full border border-strong px-4 py-2 text-sm font-medium disabled:opacity-60">
        <QrCode size={18} aria-hidden /> {pending ? "Starting…" : "Start check-in"}
      </button>
      {error && !open && <p role="alert" className="mt-1 text-xs text-brown">{error}</p>}

      {open && (
        <div className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-page p-6 text-center" role="dialog" aria-modal="true" aria-labelledby="check-in-title">
          <button onClick={() => setOpen(false)} aria-label="Close check-in"
            className="absolute right-6 top-6 grid size-11 place-items-center rounded-full border border-line bg-card">
            <X size={20} />
          </button>
          <h2 id="check-in-title" className="text-2xl font-semibold tracking-tight">Scan to check in</h2>
          <p className="mt-1 text-muted">{title}</p>
          <div className="mt-6 w-[min(80vw,420px)] rounded-[28px] bg-white p-5">
            {qr ? <div className="[&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr.svg }} /> : <div className="aspect-square" />}
          </div>
          {error ? (
            <p role="alert" className="mt-4 text-sm text-brown">{error}</p>
          ) : (
            <p className="mt-4 text-sm text-muted">{qr ? `New code in ${qr.secondsLeft} s` : "Loading…"} · Open the phone camera and point it at the code</p>
          )}
          <p className="mt-2 font-medium">{checkedIn} of {confirmed} checked in</p>
        </div>
      )}
    </>
  );
}
