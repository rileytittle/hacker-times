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

export async function getStories(feed: Feed, limit = 30): Promise<HNItem[]> {
  "use cache";
  cacheLife("minutes");
  const ids = (await getFeedIds(feed)).slice(0, limit);
  const items = await Promise.all(ids.map((id) => getItem(id).catch(() => null)));
  return items.filter((i): i is HNItem => !!i && !i.deleted && !i.dead);
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

  return { item, comments: rankTopLevel(comments, item.kids) };
}

export function countComments(comments: Comment[]): number {
  return comments.reduce((n, c) => n + 1 + countComments(c.children), 0);
}
