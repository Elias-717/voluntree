// Screen 1: sign in (FR-001), with one-tap demo sign-in (DEC-026, DEC-041).

import { Logo, PrototypeNote } from "@/components/logo";
import { DemoButtons } from "./demo-buttons";
import { EmailForm } from "./email-form";

export default function SignIn() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col px-4 py-6">
      <Logo />
      <h1 className="mt-10 text-3xl font-semibold tracking-[-0.03em]">Welcome back</h1>
      <p className="mt-1 text-muted">Sign in with your AIU account.</p>

      <EmailForm />

      <p id="demo" className="my-6 flex items-center gap-3 text-sm text-muted">
        <span className="h-px flex-1 bg-line" /> or try the demo <span className="h-px flex-1 bg-line" />
      </p>
      <DemoButtons />

      <PrototypeNote className="mt-auto pt-10 text-center" />
    </main>
  );
}
