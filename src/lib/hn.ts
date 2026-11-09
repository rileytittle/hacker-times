import { cacheLife } from "next/cache";
import type { Feed } from "./sections";

/**
 * Data access for Hacker News.
 *
 * - Story lists and single items come from the official Firebase API.
 * - Full comment trees come from Algolia's HN API, which returns the whole
 *   tree in one request (Firebase would need one request per comment).
 *
 * Both base URLs can be overridden with env vars (useful for offline dev
 * against a mock server).
 */
const HN_API = process.env.HN_API_BASE ?? "https://hacker-news.firebaseio.com/v0";
const ALGOLIA_API = process.env.HN_ALGOLIA_BASE ?? "https://hn.algolia.com/api/v1";

const FEED_ENDPOINT: Record<Feed, string> = {
  top: "topstories",
  new: "newstories",
  best: "beststories",
  ask: "askstories",
  show: "showstories",
  job: "jobstories",
};

/** Raw item shape from the Firebase API. */
export interface HNItem {
  id: number;
  type: "story" | "comment" | "job" | "poll" | "pollopt";
  by?: string;
  time: number;
  title?: string;
  url?: string;
  text?: string;
  score?: number;
  descendants?: number;
  kids?: number[];
  parent?: number;
  deleted?: boolean;
  dead?: boolean;
}

export interface Comment {
  id: number;
  by: string;
  time: number;
  /** HN-flavoured HTML. Must be sanitized before rendering. */
  text: string;
  children: Comment[];
}

export interface StoryWithComments {
  item: HNItem;
  comments: Comment[];
  /** When this was fetched (ms). Used as "now" for relative times. */
  asOf: number;
}

export interface StoryList {
  stories: HNItem[];
  asOf: number;
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HN request failed: ${res.status} ${url}`);
  return res.json() as Promise<T>;
}

export async function getFeedIds(feed: Feed): Promise<number[]> {
  "use cache";
  cacheLife("minutes");
  return getJSON<number[]>(`${HN_API}/${FEED_ENDPOINT[feed]}.json`);
}

export async function getItem(id: number): Promise<HNItem | null> {
  "use cache";
  cacheLife("minutes");
  return getJSON<HNItem | null>(`${HN_API}/item/${id}.json`);
}

export async function getStories(feed: Feed, limit = 30): Promise<StoryList> {
  "use cache";
  cacheLife("minutes");
  const ids = (await getFeedIds(feed)).slice(0, limit);
  const items = await Promise.all(ids.map((id) => getItem(id).catch(() => null)));
  return {
    stories: items.filter((i): i is HNItem => !!i && !i.deleted && !i.dead),
    asOf: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Top of the week
// ---------------------------------------------------------------------------

interface AlgoliaHit {
  objectID: string;
  title: string | null;
  url: string | null;
  author: string;
  points: number | null;
  num_comments: number | null;
  created_at_i: number;
  story_text: string | null;
}

/**
 * Most-upvoted stories created in [weekStart, weekStart + 7 days), via
 * Algolia's `search` endpoint, which ranks an empty query by popularity.
 * We still sort by points locally so the order is exact.
 */
export async function getTopOfWeek(weekStart: number, limit = 30): Promise<StoryList> {
  "use cache";
  const weekEnd = weekStart + 7 * 86_400;
  // A finished week's ranking barely changes; the current week moves fast.
  if (weekEnd * 1000 < Date.now() - 86_400_000) cacheLife("days");
  else cacheLife("minutes");

  const params = new URLSearchParams({
    tags: "story",
    numericFilters: `created_at_i>=${weekStart},created_at_i<${weekEnd}`,
    hitsPerPage: String(Math.min(limit * 2, 100)),
  });
  const { hits } = await getJSON<{ hits: AlgoliaHit[] }>(`${ALGOLIA_API}/search?${params}`);

  const stories: HNItem[] = hits
    .filter((h) => h.title)
    .map((h): HNItem => ({
      id: Number(h.objectID),
      type: "story",
      by: h.author,
      time: h.created_at_i,
      title: h.title ?? undefined,
      url: h.url ?? undefined,
      text: h.story_text ?? undefined,
      score: h.points ?? 0,
      descendants: h.num_comments ?? 0,
    }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, limit);

  return { stories, asOf: Date.now() };
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

interface AlgoliaItem {
  id: number;
  created_at_i: number;
  type: string;
  author: string | null;
  text: string | null;
  children: AlgoliaItem[];
}

function fromAlgolia(node: AlgoliaItem): Comment | null {
  const children = node.children
    .map(fromAlgolia)
    .filter((c): c is Comment => c !== null)
    .sort((a, b) => a.time - b.time);
  // Deleted comments come back with no author/text; keep them only as
  // placeholders when they still have replies.
  if (!node.author && !node.text && children.length === 0) return null;
  return {
    id: node.id,
    by: node.author ?? "[deleted]",
    time: node.created_at_i,
    text: node.text ?? "<p>[deleted]</p>",
    children,
  };
}

/**
 * Algolia doesn't preserve HN's ranking of top-level comments, so reorder
 * them using the `kids` array from Firebase (which is in ranked order).
 */
function rankTopLevel(comments: Comment[], rankedIds: number[] = []): Comment[] {
  const rank = new Map(rankedIds.map((id, i) => [id, i]));
  return [...comments].sort(
    (a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity) || a.time - b.time,
  );
}

/** Fallback when Algolia hasn't indexed an item yet: walk Firebase, with a budget. */
async function commentsFromFirebase(ids: number[], budget = { left: 200 }): Promise<Comment[]> {
  const take = ids.slice(0, Math.max(0, budget.left));
  budget.left -= take.length;
  const items = await Promise.all(take.map((id) => getItem(id).catch(() => null)));
  const out: Comment[] = [];
  for (const item of items) {
    if (!item || item.dead) continue;
    const children = item.kids ? await commentsFromFirebase(item.kids, budget) : [];
    if (item.deleted && children.length === 0) continue;
    out.push({
      id: item.id,
      by: item.by ?? "[deleted]",
      time: item.time,
      text: item.text ?? "<p>[deleted]</p>",
      children,
    });
  }
  return out;
}

export async function getStoryWithComments(id: number): Promise<StoryWithComments | null> {
  "use cache";
  cacheLife("minutes");

  const item = await getItem(id);
  if (!item || item.deleted) return null;

  let comments: Comment[];
  try {
    const tree = await getJSON<AlgoliaItem>(`${ALGOLIA_API}/items/${id}`);
    comments = tree.children.map(fromAlgolia).filter((c): c is Comment => c !== null);
  } catch {
    comments = await commentsFromFirebase(item.kids ?? []);
  }

  return { item, comments: rankTopLevel(comments, item.kids), asOf: Date.now() };
}

export function countComments(comments: Comment[]): number {
  return comments.reduce((n, c) => n + 1 + countComments(c.children), 0);
}
