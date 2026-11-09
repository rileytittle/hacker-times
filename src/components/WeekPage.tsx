import Link from "next/link";
import { getTopOfWeek } from "@/lib/hn";
import { addWeeks, FIRST_WEEK, isoDate, parseIsoDate, weekRangeLabel } from "@/lib/format";
import { StoryList } from "./StoryList";

/** Most-upvoted stories posted during the week starting `monday`. */
export async function WeekPage({ monday, currentMonday }: { monday: number; currentMonday: number }) {
  const { stories, asOf } = await getTopOfWeek(monday);
  const isCurrent = monday === currentMonday;
  const prev = addWeeks(monday, -1);
  const next = addWeeks(monday, 1);
  const hasPrev = prev >= (parseIsoDate(FIRST_WEEK) ?? 0);

  return (
    <>
      <div className="week-header">
        <div>
          <h1 className="page-title">Top of the Week</h1>
          <p className="week-header__range">
            {weekRangeLabel(monday)}
            {isCurrent && <span className="week-header__live"> · so far</span>}
          </p>
        </div>
        <nav className="week-nav" aria-label="Choose week">
          {hasPrev ? (
            <Link href={`/week/${isoDate(prev)}`} rel="prev">
              ← Previous
            </Link>
          ) : (
            <span aria-disabled="true">← Previous</span>
          )}
          {!isCurrent && <Link href="/week">This week</Link>}
          {!isCurrent ? (
            <Link href={next === currentMonday ? "/week" : `/week/${isoDate(next)}`} rel="next">
              Next →
            </Link>
          ) : (
            <span aria-disabled="true">Next →</span>
          )}
        </nav>
      </div>
      <StoryList stories={stories} asOf={asOf} />
    </>
  );
}
