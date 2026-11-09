import sanitizeHtml, { type Attributes } from "sanitize-html";

/**
 * Sanitize HN-flavoured HTML (comments and self-post text). HN only emits a
 * small set of tags, so we allow-list just those. Links to HN items are
 * rewritten to stay inside the app.
 */
export function sanitizeHN(html: string): string {
  return structure(clean(html));
}

/**
 * HN text is "first para<p>second para..." (first paragraph unwrapped). Wrap
 * it so every paragraph gets the same spacing, and turn HN's plain-text
 * "> quoted" paragraphs into styled quotes.
 */
function structure(html: string): string {
  let out = html.trim();
  if (!out) return out;
  const firstBlock = out.search(/<p>|<pre>/);
  if (firstBlock !== 0) {
    out =
      firstBlock === -1
        ? `<p>${out}</p>`
        : `<p>${out.slice(0, firstBlock)}</p>${out.slice(firstBlock)}`;
  }
  return out.replace(/<p>\s*&gt;\s?/g, '<p class="quote">').replace(/<p>\s*<\/p>/g, "");
}

function clean(html: string): string {
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
