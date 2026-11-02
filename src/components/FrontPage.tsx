import { cacheLife } from "next/cache";
import { getStories } from "@/lib/hn";
import { getLinkPreview } from "@/lib/preview";
import type { Feed } from "@/lib/sections";
import { StoryCard } from "./StoryCard";

/** Number of stories that get a scraped image/summary. */
const FEATURED = 7;

async function getFrontPageData(feed: Feed) {
  "use cache";
  cacheLife("minutes");
  const stories = await getStories(feed, 30);
  const previews = await Promise.all(
    stories.slice(0, FEATURED).map((s) => (s.url ? getLinkPreview(s.url) : null)),
  );
  // Relative times ("3 hrs ago") are computed against when this edition was built.
  return { stories, previews, asOf: Date.now() };
}

export async function FrontPage({ feed, heading }: { feed: Feed; heading?: string }) {
  const { stories, previews, asOf: now } = await getFrontPageData(feed);

  if (stories.length === 0) {
    return <p className="empty">No stories in this section right now.</p>;
  }

  const [lead, ...rest] = stories;
  const secondary = rest.slice(0, 2);
  const side = rest.slice(2, FEATURED - 1);
  const more = rest.slice(FEATURED - 1);
  const previewAt = (i: number) => previews[i] ?? null;

  return (
    <>
      {heading && <h1 className="section-heading">{heading}</h1>}
      <section className="fp-top">
        <div className="fp-main">
          <StoryCard story={lead} preview={previewAt(0)} variant="lead" now={now} />
          <div className="fp-secondary">
            {secondary.map((s, i) => (
              <StoryCard key={s.id} story={s} preview={previewAt(i + 1)} variant="standard" now={now} />
            ))}
          </div>
        </div>
        <aside className="fp-side">
          {side.map((s, i) => (
            <StoryCard key={s.id} story={s} preview={previewAt(i + 3)} variant="side" now={now} />
          ))}
        </aside>
      </section>

      {more.length > 0 && (
        <section>
          <h2 className="rule-heading">More Headlines</h2>
          <div className="fp-grid">
            {more.map((s) => (
              <StoryCard key={s.id} story={s} variant="compact" now={now} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export function FrontPageSkeleton() {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Loading stories">
      <div className="skeleton__block skeleton__block--lead" />
      <div className="skeleton__row">
        <div className="skeleton__block" />
        <div className="skeleton__block" />
        <div className="skeleton__block" />
      </div>
    </div>
  );
}
