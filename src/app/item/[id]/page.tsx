import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Comments, ThreadOutline } from "@/components/Comments";
import { LinkCard } from "@/components/LinkCard";
import { ThreadControls } from "@/components/ThreadControls";
import { countComments, getItem, getStoryWithComments } from "@/lib/hn";
import { getLinkPreview } from "@/lib/preview";
import { domainOf, fullTimestamp, plural, timeAgo } from "@/lib/format";
import { sanitizeHN } from "@/lib/sanitize";

function parseId(raw: string): number | null {
  return /^\d{1,10}$/.test(raw) ? Number(raw) : null;
}

export async function generateMetadata({ params }: PageProps<"/item/[id]">): Promise<Metadata> {
  const id = parseId((await params).id);
  const item = id ? await getItem(id).catch(() => null) : null;
  return { title: item?.title ?? "Story" };
}

async function Story({ params }: Pick<PageProps<"/item/[id]">, "params">) {
  const id = parseId((await params).id);
  if (!id) notFound();

  const data = await getStoryWithComments(id);
  if (!data || !data.item.title) notFound();

  const { item, comments, asOf } = data;
  const preview = item.url ? await getLinkPreview(item.url) : null;
  const total = countComments(comments);
  const domain = domainOf(item.url);

  return (
    <div className="item-layout">
      <article className="item">
        <header className="item__header">
          <h1 className="item__title">{item.title}</h1>
          <p className="item__meta">
            {item.type !== "job" && <span className="item__points">{plural(item.score ?? 0, "point")}</span>}
            {item.by && (
              <span>
                by{" "}
                <a href={`https://news.ycombinator.com/user?id=${item.by}`} target="_blank" rel="noopener noreferrer">
                  {item.by}
                </a>
              </span>
            )}
            <time dateTime={new Date(item.time * 1000).toISOString()} title={fullTimestamp(item.time)}>
              {timeAgo(item.time, asOf)}
            </time>
            {domain && <span>{domain}</span>}
          </p>
        </header>

        {item.url && <LinkCard url={item.url} preview={preview} />}

        {item.text && <div className="item__text prose" dangerouslySetInnerHTML={{ __html: sanitizeHN(item.text) }} />}

        {item.type !== "job" && (
          <section className="item__comments" id="comments" aria-label="Comments">
            <ThreadControls storyId={item.id} total={total} />
            <Comments comments={comments} op={item.by} asOf={asOf} />
          </section>
        )}
      </article>

      <aside className="item-layout__aside">
        <ThreadOutline comments={comments} op={item.by} />
      </aside>
    </div>
  );
}

function StorySkeleton() {
  return (
    <div className="item-layout" aria-busy="true" aria-label="Loading story">
      <div className="item">
        <div className="skeleton-bar skeleton-bar--headline" />
        <div className="skeleton-bar skeleton-bar--meta" />
        <div className="skeleton-card" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton-row">
            <div className="skeleton-bar skeleton-bar--meta" />
            <div className="skeleton-bar skeleton-bar--title" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ItemPage({ params }: PageProps<"/item/[id]">) {
  return (
    <Suspense fallback={<StorySkeleton />}>
      <Story params={params} />
    </Suspense>
  );
}
