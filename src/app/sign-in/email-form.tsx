"use client";

import { useActionState } from "react";
import { signInWithEmail } from "./actions";

export function EmailForm() {
  const [error, formAction, pending] = useActionState(signInWithEmail, null);
  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        Email
        <input name="email" type="email" required autoComplete="email" placeholder="you@student.aiu.edu.my"
          className="rounded-[14px] border border-line bg-card px-4 py-3.5 text-base" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Password
        <input name="password" type="password" required autoComplete="current-password"
          className="rounded-[14px] border border-line bg-card px-4 py-3.5 text-base" />
      </label>
      {error && <p role="alert" className="text-sm text-brown">{error}</p>}
      <button disabled={pending} className="rounded-full bg-primary py-3.5 font-medium text-on-primary disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
