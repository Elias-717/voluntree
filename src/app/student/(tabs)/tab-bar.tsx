"use client";

// The black student tab bar (DEC-035): icons with labels, My tree as the green centre button.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, ListBullets, Medal, Plant, User } from "@phosphor-icons/react";

const TABS = [
  { href: "/student", label: "Home", Icon: Compass },
  { href: "/student/missions", label: "Missions", Icon: ListBullets },
  { href: "/student/tree", label: "My tree", Icon: Plant, centre: true },
  { href: "/student/certificates", label: "Certificates", Icon: Medal },
  { href: "/student/me", label: "Me", Icon: User },
];

export function TabBar() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="sticky bottom-0 mt-auto rounded-t-[28px] bg-navbar px-2 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
      <ul className="flex items-end justify-between">
        {TABS.map(({ href, label, Icon, centre }) => {
          const active = href === "/student" ? path === href : path.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 text-[11px] ${active ? "font-semibold text-on-nav-active" : "text-on-nav"}`}
              >
                <span className={centre ? "grid h-10 w-14 place-items-center rounded-[14px] bg-primary text-on-primary" : "grid h-10 place-items-center"}>
                  <Icon size={24} weight={active || centre ? "fill" : "regular"} aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
