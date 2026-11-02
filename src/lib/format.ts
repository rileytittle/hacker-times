export function domainOf(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export function timeAgo(unixSeconds: number, nowMs = Date.now()): string {
  const s = Math.max(0, Math.floor(nowMs / 1000 - unixSeconds));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
  return longDate(unixSeconds);
}

export function longDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
}

export function plural(n: number, word: string): string {
  return `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`;
}

/** Strip HN HTML to plain text (for short summaries). */
export function htmlToText(html: string): string {
  return html
    .replace(/<p>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, s.lastIndexOf(" ", max) > 0 ? s.lastIndexOf(" ", max) : max) + "…";
}

/** NYT-style dateline, e.g. "Nov. 2, 2026, 10:14 a.m. ET". */
export function articleDate(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  const month = parts.month === "May" ? "May" : `${parts.month}.`;
  const ampm = parts.dayPeriod === "AM" ? "a.m." : "p.m.";
  return `${month} ${parts.day}, ${parts.year}, ${parts.hour}:${parts.minute} ${ampm} ET`;
}
