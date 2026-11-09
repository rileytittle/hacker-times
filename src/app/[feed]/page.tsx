import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FeedPage } from "@/components/FeedPage";
import { ListSkeleton } from "@/components/StoryList";
import { SLUGGED_FEEDS, feedBySlug } from "@/lib/sections";

export function generateStaticParams() {
  return SLUGGED_FEEDS.map((f) => ({ feed: f.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[feed]">): Promise<Metadata> {
  const tab = feedBySlug((await params).feed);
  return { title: tab?.label ?? "Not found" };
}

async function Content({ params }: Pick<PageProps<"/[feed]">, "params">) {
  const tab = feedBySlug((await params).feed);
  if (!tab) notFound();
  return <FeedPage feed={tab.feed} />;
}

export default function Page({ params }: PageProps<"/[feed]">) {
  return (
    <div className="list-page">
      <Suspense fallback={<ListSkeleton />}>
        <Content params={params} />
      </Suspense>
    </div>
  );
}
