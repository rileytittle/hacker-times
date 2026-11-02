/* eslint-disable @next/next/no-img-element -- og:images come from arbitrary hosts */
import Link from "next/link";
import type { HNItem } from "@/lib/hn";
import type { LinkPreview } from "@/lib/preview";
import { domainOf, htmlToText, plural, timeAgo, truncate } from "@/lib/format";

export type CardVariant = "lead" | "standard" | "side" | "compact";

interface Props {
  story: HNItem;
  preview?: LinkPreview | null;
  variant?: CardVariant;
  now: number;
}

export function kickerFor(story: HNItem): string {
  if (story.type === "job") return "Jobs";
  const title = story.title ?? "";
  if (/^ask hn/i.test(title)) return "Ask HN";
  if (/^show hn/i.test(title)) return "Show HN";
  if (/^tell hn/i.test(title)) return "Tell HN";
  return domainOf(story.url) ?? "Hacker News";
}

export function StoryCard({ story, preview, variant = "standard", now }: Props) {
  const href = `/item/${story.id}`;
  const dek =
    preview?.description ?? (story.text ? truncate(htmlToText(story.text), 220) : undefined);
  const showImage = variant !== "compact" && preview?.image;
  const showDek = variant === "lead" || variant === "standard";

  return (
    <article className={`story story--${variant}`}>
      {showImage && (
        <Link href={href} className="story__image" tabIndex={-1} aria-hidden>
          <img src={preview!.image} alt="" loading={variant === "lead" ? "eager" : "lazy"} referrerPolicy="no-referrer" />
        </Link>
      )}
      <div className="story__body">
        <p className="kicker">{kickerFor(story)}</p>
        <h2 className="story__headline">
          <Link href={href}>{story.title}</Link>
        </h2>
        {showDek && dek && <p className="story__dek">{truncate(dek, variant === "lead" ? 320 : 180)}</p>}
        <p className="story__meta">
          {story.by && <span>By {story.by}</span>}
          <span>{timeAgo(story.time, now)}</span>
          {story.type !== "job" && (
            <>
              <span>{plural(story.score ?? 0, "point")}</span>
              <span>{plural(story.descendants ?? 0, "comment")}</span>
            </>
          )}
        </p>
      </div>
    </article>
  );
}
