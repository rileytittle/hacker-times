import { cacheLife } from "next/cache";

/**
 * Server-side Open Graph scraper used to give stories a newspaper-style
 * image + dek. Fails soft: any problem returns null and the UI falls back to
 * a text-only presentation.
 */
export interface LinkPreview {
  url: string;
  siteName?: string;
  title?: string;
  description?: string;
  image?: string;
}

const MAX_BYTES = 512 * 1024;
const MAX_REDIRECTS = 4;
const TIMEOUT_MS = 4000;

/**
 * Basic SSRF guard: only fetch public http(s) hosts. This blocks literal
 * private/loopback addresses and localhost names; it does not resolve DNS,
 * so it won't catch a public name that points at a private IP.
 */
function isFetchable(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  // Escape hatch for offline dev against a local mock server. Never honored in production.
  if (process.env.NODE_ENV !== "production" && process.env.LINK_PREVIEW_ALLOW_PRIVATE_HOSTS === "1") {
    return true;
  }
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) return false;
  // Story links essentially never use raw IPv6 literals; reject them all.
  if (host.includes(":")) return false;
  const v4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 0 || a === 10 || a === 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
  }
  return true;
}

async function fetchHead(startUrl: string): Promise<{ html: string; finalUrl: string } | null> {
  let url = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isFetchable(url)) return null;
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; HackerTimesBot/1.0; +link-preview)",
        accept: "text/html,application/xhtml+xml",
      },
    });

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      await res.body?.cancel();
      if (!loc) return null;
      url = new URL(loc, url).toString();
      continue;
    }
    if (!res.ok || !res.body) return null;
    if (!(res.headers.get("content-type") ?? "").includes("html")) {
      await res.body.cancel();
      return null;
    }

    // Read until </head> or the size cap; og tags live in <head>.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let html = "";
    let bytes = 0;
    while (bytes < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      html += decoder.decode(value, { stream: true });
      if (/<\/head>/i.test(html)) break;
    }
    await reader.cancel().catch(() => {});
    return { html, finalUrl: url };
  }
  return null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function parseMeta(html: string): Map<string, string> {
  const meta = new Map<string, string>();
  for (const tag of html.match(/<meta\s[^>]*>/gi) ?? []) {
    const attrs: Record<string, string> = {};
    for (const m of tag.matchAll(/([a-zA-Z:_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
    }
    const key = (attrs.property ?? attrs.name ?? "").toLowerCase();
    if (key && attrs.content && !meta.has(key)) meta.set(key, decodeEntities(attrs.content));
  }
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title && !meta.has("title")) meta.set("title", decodeEntities(title[1]));
  return meta;
}

function absoluteHttpUrl(value: string | undefined, base: string): string | undefined {
  if (!value) return undefined;
  try {
    const u = new URL(value, base);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

export async function getLinkPreview(url: string): Promise<LinkPreview | null> {
  "use cache";
  cacheLife("days");
  try {
    const page = await fetchHead(url);
    if (!page) return null;
    const meta = parseMeta(page.html);
    const get = (...keys: string[]) => keys.map((k) => meta.get(k)).find(Boolean);
    return {
      url,
      siteName: get("og:site_name", "application-name"),
      title: get("og:title", "twitter:title", "title"),
      description: get("og:description", "twitter:description", "description"),
      image: absoluteHttpUrl(
        get("og:image:secure_url", "og:image", "og:image:url", "twitter:image", "twitter:image:src"),
        page.finalUrl,
      ),
    };
  } catch {
    return null;
  }
}
