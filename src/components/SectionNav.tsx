"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ALL_SECTIONS } from "@/lib/sections";

export function SectionNav() {
  const pathname = usePathname();
  return (
    <nav className="section-nav" aria-label="Sections">
      <ul>
        {ALL_SECTIONS.map((s) => {
          const active = s.href === "/" ? pathname === "/" : pathname.startsWith(s.href);
          return (
            <li key={s.href}>
              <Link href={s.href} aria-current={active ? "page" : undefined}>
                {s.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
