"use client";

// One-tap demo sign-in (DEC-026). While a sign-in runs, the tapped card says "Signing in…" with a
// spinner and every card is disabled, so it is clear something is happening and nobody taps twice.

import { useState, useTransition } from "react";
import { ArrowRight, CircleNotch, Plant } from "@phosphor-icons/react";
import { signInAsDemo, signInAsGuest } from "./actions";

const DEMO = [
  { who: "student", initials: "FH", name: "Farid Hassan", role: "Student" },
  { who: "organizer", initials: "MF", name: "Madam Fazilah", role: "Organizer" },
  { who: "admin", initials: "MN", name: "Madam Nadya", role: "Admin" },
] as const;

export function DemoButtons() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const signingIn = pending ? busy : null;

  return (
    <>
    {/* A fresh guest student of their own (DEC-055), so visitors don't share Farid. */}
    <button
      onClick={() => { setBusy("guest"); setError(null); startTransition(async () => setError(await signInAsGuest())); }}
      disabled={signingIn !== null}
      className="mb-3 flex w-full items-center gap-3 rounded-[18px] bg-primary p-4 text-left text-on-primary disabled:opacity-60"
    >
      <span className="grid size-11 place-items-center rounded-full bg-white/20">
        <Plant size={22} weight="fill" aria-hidden />
      </span>
      <span className="flex-1">
        <span className="block font-semibold">Try as a new student</span>
        <span className="block text-sm opacity-85" aria-live="polite">
          {signingIn === "guest" ? "Planting your seed…" : "Your own account and seed, from the start"}
        </span>
      </span>
      {signingIn === "guest"
        ? <CircleNotch size={20} className="animate-spin motion-reduce:animate-none" aria-hidden />
        : <ArrowRight size={20} aria-hidden />}
    </button>
    {error && <p role="alert" className="mb-3 text-sm text-brown">{error}</p>}

    <ul className="flex flex-col gap-3" aria-busy={signingIn !== null}>
      {DEMO.map((d) => (
        <li key={d.who}>
          <button
            onClick={() => { setBusy(d.who); startTransition(() => signInAsDemo(d.who)); }}
            disabled={signingIn !== null}
            className="flex w-full items-center gap-3 rounded-[18px] border border-line bg-card p-4 text-left disabled:opacity-60"
          >
            <span className="grid size-11 place-items-center rounded-full bg-tint text-sm font-semibold text-on-tint">
              {d.initials}
            </span>
            <span className="flex-1">
              <span className="block font-semibold">{d.name}</span>
              <span className="block text-sm text-muted" aria-live="polite">
                {signingIn === d.who ? "Signing in…" : d.role}
              </span>
            </span>
            {signingIn === d.who
              ? <CircleNotch size={20} className="animate-spin motion-reduce:animate-none" aria-hidden />
              : <ArrowRight size={20} aria-label={`Sign in as ${d.name}`} />}
          </button>
        </li>
      ))}
    </ul>
    </>
  );
}
