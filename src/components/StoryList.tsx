/* eslint-disable @next/next/no-img-element -- favicons from a third-party service */
import Link from "next/link";
import type { HNItem } from "@/lib/hn";
import { domainOf, fullTimestamp, plural, timeAgo } from "@/lib/format";

export function Favicon({ domain }: { domain?: string }) {
  if (!domain) {
    return (
      <span className="favicon favicon--hn" aria-hidden>
        Y
      </span>
    );
  }
  return (
    <img
      className="favicon"
      src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
      alt=""
      width={16}
      height={16}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}

export function StoryList({ stories, asOf }: { stories: HNItem[]; asOf: number }) {
  if (stories.length === 0) return <p className="empty">Nothing here right now.</p>;
  return (
    <ol className="story-list">
      {stories.map((s, i) => (
        <StoryRow key={s.id} story={s} rank={i + 1} asOf={asOf} />
      ))}
    </ol>
  );
}

function StoryRow({ story, rank, asOf }: { story: HNItem; rank: number; asOf: number }) {
  const domain = domainOf(story.url);
  const href = `/item/${story.id}`;
  const comments = story.descendants ?? 0;
  const isJob = story.type === "job";

  return (
    <li className="story-row">
      <span className="story-row__rank">{rank}</span>
      <div className="story-row__main">
        <div className="story-row__titleline">
          <Favicon domain={domain} />
          <Link href={href} className="story-row__title">
            {story.title}
          </Link>
          {domain && (
            <a
              className="story-row__domain"
              href={story.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`Open ${domain} in a new tab`}
            >
              {domain} <span aria-hidden>↗</span>
            </a>
          )}
        </div>
        <div className="story-row__meta">
          {!isJob && <span className="story-row__points">{plural(story.score ?? 0, "point")}</span>}
          {story.by && <span>by {story.by}</span>}
          <time dateTime={new Date(story.time * 1000).toISOString()} title={fullTimestamp(story.time)}>
            {timeAgo(story.time, asOf)}
          </time>
        </div>
      </div>
      {!isJob && (
        <Link href={href} className="story-row__comments" aria-label={plural(comments, "comment")}>
          <span className="story-row__count">{comments.toLocaleString("en-US")}</span>
          <span className="story-row__count-label">{comments === 1 ? "comment" : "comments"}</span>
        </Link>
      )}
    </li>
  );
}

export function ListSkeleton() {
  return (
    <div className="story-list story-list--skeleton" aria-busy="true" aria-label="Loading stories">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="skeleton-row">
          <div className="skeleton-bar skeleton-bar--title" />
          <div className="skeleton-bar skeleton-bar--meta" />
        </div>
      ))}
    </div>
  );
}
