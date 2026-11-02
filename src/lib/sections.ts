export type Feed = "top" | "new" | "best" | "ask" | "show" | "job";

export interface Section {
  feed: Feed;
  /** URL slug under /section/ (empty for the front page). */
  slug: string;
  label: string;
  href: string;
}

export const FRONT_PAGE: Section = {
  feed: "top",
  slug: "",
  label: "Front Page",
  href: "/",
};

export const SECTIONS: Section[] = [
  { feed: "new", slug: "latest", label: "Latest", href: "/section/latest" },
  { feed: "best", slug: "best", label: "Best", href: "/section/best" },
  { feed: "ask", slug: "ask", label: "Ask HN", href: "/section/ask" },
  { feed: "show", slug: "show", label: "Show HN", href: "/section/show" },
  { feed: "job", slug: "jobs", label: "Jobs", href: "/section/jobs" },
];

export const ALL_SECTIONS = [FRONT_PAGE, ...SECTIONS];

export function sectionBySlug(slug: string): Section | undefined {
  return SECTIONS.find((s) => s.slug === slug);
}
