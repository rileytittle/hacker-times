/* eslint-disable @next/next/no-img-element -- og:images come from arbitrary hosts */
import type { LinkPreview } from "@/lib/preview";
import { domainOf } from "@/lib/format";
import { Favicon } from "./StoryList";

/** The story's link, shown as a compact preview at the top of the thread. */
export function LinkCard({ url, preview }: { url: string; preview: LinkPreview | null }) {
  const domain = domainOf(url) ?? url;
  return (
    <a className="link-card" href={url} target="_blank" rel="noopener noreferrer">
      <span className="link-card__body">
        <span className="link-card__site">
          <Favicon domain={domainOf(url)} />
          {preview?.siteName ?? domain}
        </span>
        {preview?.title && <span className="link-card__title">{preview.title}</span>}
        {preview?.description && <span className="link-card__desc">{preview.description}</span>}
        <span className="link-card__cta">
          Read the article <span aria-hidden>↗</span>
        </span>
      </span>
      {preview?.image && (
        <span className="link-card__image">
          <img src={preview.image} alt="" referrerPolicy="no-referrer" />
        </span>
      )}
    </a>
  );
}
