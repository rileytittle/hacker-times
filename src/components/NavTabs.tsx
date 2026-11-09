"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FEEDS } from "@/lib/sections";

const TABS = [...FEEDS.map((f) => ({ label: f.label, href: f.href })), { label: "Top of the Week", href: "/week" }];

function isActive(href: string, pathname: string | null) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Pure nav; `pathname` null renders with no active tab (static fallback). */
export function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav className="nav-tabs" aria-label="Feeds">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={t.href === "/week" ? "nav-tabs__week" : undefined}
          aria-current={isActive(t.href, pathname) ? "page" : undefined}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

export function NavTabs() {
  return <NavLinks pathname={usePathname()} />;
}
