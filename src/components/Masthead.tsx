import Link from "next/link";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { SectionNav } from "./SectionNav";
import { ALL_SECTIONS } from "@/lib/sections";

async function TodaysDate() {
  "use cache";
  cacheLife("hours");
  return (
    <>
      {new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "America/New_York",
      })}
    </>
  );
}

export function Masthead() {
  return (
    <header className="masthead">
      <div className="masthead__top">
        <span className="masthead__date">
          <Suspense fallback={null}>
            <TodaysDate />
          </Suspense>
        </span>
        <span className="masthead__edition">Today&rsquo;s Paper · Powered by Hacker News</span>
      </div>
      <Link href="/" className="masthead__title">
        The Hacker Times
      </Link>
      <Suspense fallback={<StaticNav />}>
        <SectionNav />
      </Suspense>
    </header>
  );
}

function StaticNav() {
  return (
    <nav className="section-nav" aria-label="Sections">
      <ul>
        {ALL_SECTIONS.map((s) => (
          <li key={s.href}>
            <Link href={s.href}>{s.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
