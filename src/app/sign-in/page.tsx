// Screen 1: sign in (FR-001), with one-tap demo sign-in (DEC-026, DEC-041).

import { ArrowRight } from "@phosphor-icons/react/ssr";
import { Logo, PrototypeNote } from "@/components/logo";
import { signInAsDemo } from "./actions";
import { EmailForm } from "./email-form";

const DEMO = [
  { who: "student", initials: "FH", name: "Farid Hassan", role: "Student" },
  { who: "organizer", initials: "MF", name: "Madam Fazilah", role: "Organizer" },
  { who: "admin", initials: "MN", name: "Madam Nadya", role: "Admin" },
] as const;

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
      <ul className="flex flex-col gap-3">
        {DEMO.map((d) => (
          <li key={d.who}>
            <form action={signInAsDemo.bind(null, d.who)}>
              <button className="flex w-full items-center gap-3 rounded-[18px] border border-line bg-card p-4 text-left">
                <span className="grid size-11 place-items-center rounded-full bg-tint text-sm font-semibold text-on-tint">
                  {d.initials}
                </span>
                <span className="flex-1">
                  <span className="block font-semibold">{d.name}</span>
                  <span className="block text-sm text-muted">{d.role}</span>
                </span>
                <ArrowRight size={20} aria-label={`Sign in as ${d.name}`} />
              </button>
            </form>
          </li>
        ))}
      </ul>

      <PrototypeNote className="mt-auto pt-10 text-center" />
    </main>
  );
}
