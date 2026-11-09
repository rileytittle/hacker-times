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

// ---------------------------------------------------------------------------
// Weeks (Monday-start, UTC)
// ---------------------------------------------------------------------------

const DAY = 86_400;
/** Monday of the week Hacker News launched. */
export const FIRST_WEEK = "2007-02-19";

export function isoDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}

/** Unix seconds for 00:00 UTC on the Monday of the week containing `unixSeconds`. */
export function mondayOf(unixSeconds: number): number {
  const dayStart = Math.floor(unixSeconds / DAY) * DAY;
  const weekday = (new Date(dayStart * 1000).getUTCDay() + 6) % 7; // Mon=0
  return dayStart - weekday * DAY;
}

/** Parse "YYYY-MM-DD" to unix seconds (UTC midnight), or null if invalid. */
export function parseIsoDate(s: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const ms = Date.parse(`${s}T00:00:00Z`);
  if (Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== s) return null;
  return ms / 1000;
}

export function addWeeks(monday: number, n: number): number {
  return monday + n * 7 * DAY;
}

/** e.g. "Nov 2 – 8, 2026" or "Dec 29, 2025 – Jan 4, 2026". */
export function weekRangeLabel(monday: number): string {
  const start = new Date(monday * 1000);
  const end = new Date((monday + 6 * DAY) * 1000);
  const md = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const y = (d: Date) => d.getUTCFullYear();
  if (y(start) !== y(end)) return `${md(start)}, ${y(start)} – ${md(end)}, ${y(end)}`;
  if (start.getUTCMonth() === end.getUTCMonth()) return `${md(start)} – ${end.getUTCDate()}, ${y(end)}`;
  return `${md(start)} – ${md(end)}, ${y(end)}`;
}

/** Absolute timestamp for tooltips, e.g. "Nov 2, 2026, 10:14 AM ET". */
export function fullTimestamp(unixSeconds: number): string {
  return (
    new Date(unixSeconds * 1000).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    }) + " ET"
  );
}
