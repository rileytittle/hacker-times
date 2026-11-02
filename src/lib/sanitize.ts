import sanitizeHtml, { type Attributes } from "sanitize-html";

/**
 * Sanitize HN-flavoured HTML (comments and self-post text). HN only emits a
 * small set of tags, so we allow-list just those. Links to HN items are
 * rewritten to stay inside the app.
 */
export function sanitizeHN(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "a", "i", "em", "b", "strong", "pre", "code", "br"],
    allowedAttributes: { a: ["href", "rel", "target"] },
    allowedSchemes: ["http", "https"],
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? "";
        const internal = href.match(/^https?:\/\/news\.ycombinator\.com\/item\?id=(\d+)$/);
        const out: Attributes = internal
          ? { href: `/item/${internal[1]}` }
          : { href, target: "_blank", rel: "noopener noreferrer nofollow" };
        return { tagName, attribs: out };
      },
    },
  });
}
