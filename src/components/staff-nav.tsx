"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
  badge?: number;
}

export function StaffNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  // The longest matching link is the active one, so /admin does not light up on /admin/missions.
  const active = items
    .filter((i) => path === i.href || path.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav aria-label="Main">
      <ul className="flex gap-1 overflow-x-auto md:flex-col">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} aria-current={active === i.href ? "page" : undefined}
              className={`flex items-center justify-between gap-2 whitespace-nowrap rounded-[12px] px-3 py-2.5 text-sm font-medium ${active === i.href ? "bg-tint text-on-tint" : "text-muted hover:text-text"}`}>
              {i.label}
              {!!i.badge && <span className="rounded-full bg-brown-tint px-2 text-xs text-brown">{i.badge}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
