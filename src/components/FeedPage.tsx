import { getStories } from "@/lib/hn";
import type { Feed } from "@/lib/sections";
import { StoryList } from "./StoryList";

export async function FeedPage({ feed }: { feed: Feed }) {
  const { stories, asOf } = await getStories(feed, 30);
  return <StoryList stories={stories} asOf={asOf} />;
}
