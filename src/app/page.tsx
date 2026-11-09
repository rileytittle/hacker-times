import { Suspense } from "react";
import { FeedPage } from "@/components/FeedPage";
import { ListSkeleton } from "@/components/StoryList";

export default function Home() {
  return (
    <div className="list-page">
      <Suspense fallback={<ListSkeleton />}>
        <FeedPage feed="top" />
      </Suspense>
    </div>
  );
}
