import Link from "next/link";
import { Suspense } from "react";
import { NavLinks, NavTabs } from "./NavTabs";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="wordmark">
          <span className="wordmark__mark" aria-hidden>
            H
          </span>
          Hacker Times
        </Link>
        <Suspense fallback={<NavLinks pathname={null} />}>
          <NavTabs />
        </Suspense>
      </div>
    </header>
  );
}
