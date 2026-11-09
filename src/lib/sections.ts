export type Feed = "top" | "new" | "best" | "ask" | "show" | "job";

export interface FeedTab {
  feed: Feed;
  /** URL slug (empty for the home page). */
  slug: string;
  label: string;
  href: string;
}

export const FEEDS: FeedTab[] = [
  { feed: "top", slug: "", label: "Top", href: "/" },
  { feed: "new", slug: "new", label: "New", href: "/new" },
  { feed: "best", slug: "best", label: "Best", href: "/best" },
  { feed: "ask", slug: "ask", label: "Ask", href: "/ask" },
  { feed: "show", slug: "show", label: "Show", href: "/show" },
  { feed: "job", slug: "jobs", label: "Jobs", href: "/jobs" },
];

/** Feeds that live under /[feed] (everything except the home page). */
export const SLUGGED_FEEDS = FEEDS.filter((f) => f.slug);

export function feedBySlug(slug: string): FeedTab | undefined {
  return SLUGGED_FEEDS.find((f) => f.slug === slug);
}
