// Desktop-first frame for organizer and admin screens (DEC-026): sidebar on wide screens,
// a top bar on phones. The links are passed in by each role's layout.

import Link from "next/link";
import { UserSwitch } from "@phosphor-icons/react/ssr";
import { Appearance } from "./appearance";
import { AutoRefresh } from "./auto-refresh";
import { Logo } from "./logo";
import { StaffNav, type NavItem } from "./staff-nav";
import { signOut } from "@/app/sign-in/actions";

interface Props {
  home: string;
  name: string;
  roleLabel: string;
  nav: NavItem[];
  children: React.ReactNode;
}

export function StaffShell({ home, name, roleLabel, nav, children }: Props) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <aside className="flex flex-col gap-4 border-line bg-card px-4 py-4 md:sticky md:top-0 md:h-svh md:w-60 md:border-r md:py-6">
        <Logo href={home} />
        <StaffNav items={nav} />
        <div className="mt-auto hidden flex-col gap-3 border-t border-line pt-4 md:flex">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-tint text-sm font-semibold text-on-tint">{initials}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="truncate text-xs text-muted">{roleLabel}</p>
            </div>
          </div>
          <Appearance compact />
          <div className="flex gap-2 text-xs font-medium">
            <Link href="/sign-in#demo" className="inline-flex items-center gap-1.5 rounded-full bg-tint px-3 py-2 text-on-tint">
              <UserSwitch size={14} aria-hidden /> Switch demo user
            </Link>
            <form action={signOut}>
              <button className="rounded-full border border-line px-3 py-2">Sign out</button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
      <AutoRefresh />
      <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3 text-xs md:hidden">
        <span className="truncate">{name} · {roleLabel}</span>
        <form action={signOut}>
          <button className="rounded-full border border-line px-3 py-2 font-medium">Sign out</button>
        </form>
      </div>
    </div>
  );
}
