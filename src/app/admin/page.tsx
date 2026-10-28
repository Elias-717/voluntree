// Admin home. Placeholder until its Phase 2 slice is built.

import { Logo } from "@/components/logo";
import { requireRole } from "@/lib/db/session";
import { signOut } from "../sign-in/actions";

export default async function AdminHome() {
  const me = await requireRole("admin");
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-4 py-6">
      <Logo href="/admin" />
      <h1 className="text-2xl font-semibold tracking-tight">Hello, {me.displayName}</h1>
      <p className="text-muted">The admin screens are coming in the next build step.</p>
      <form action={signOut}>
        <button className="rounded-full border border-strong px-5 py-2.5 font-medium">Sign out</button>
      </form>
    </main>
  );
}
