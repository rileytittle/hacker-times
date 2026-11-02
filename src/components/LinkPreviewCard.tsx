/* eslint-disable @next/next/no-img-element -- og:images come from arbitrary hosts */
import type { LinkPreview } from "@/lib/preview";
import { domainOf } from "@/lib/format";

/**
 * The story's link, presented as the lead art + "read the original" call out.
 * (The og:description is shown as the article dek, so it isn't repeated here.)
 */
export function LinkPreviewCard({ url, preview }: { url: string; preview: LinkPreview | null }) {
  const domain = domainOf(url) ?? url;
  return (
    <a className="link-card" href={url} target="_blank" rel="noopener noreferrer">
      {preview?.image && (
        <span className="link-card__image">
          <img src={preview.image} alt="" referrerPolicy="no-referrer" />
        </span>
      )}
      <span className="link-card__body">
        <span className="kicker">{preview?.siteName ?? domain}</span>
        {preview?.title && <span className="link-card__title">{preview.title}</span>}
        <span className="link-card__cta">
          Read the original at {domain} <span aria-hidden>→</span>
        </span>
      </span>
    </a>
  );
}
