import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CommentThread } from "@/components/CommentThread";
import { LinkPreviewCard } from "@/components/LinkPreviewCard";
import { kickerFor } from "@/components/StoryCard";
import { countComments, getItem, getStoryWithComments } from "@/lib/hn";
import { getLinkPreview } from "@/lib/preview";
import { articleDate, plural } from "@/lib/format";
import { sanitizeHN } from "@/lib/sanitize";

function parseId(raw: string): number | null {
  return /^\d{1,10}$/.test(raw) ? Number(raw) : null;
}

export async function generateMetadata({ params }: PageProps<"/item/[id]">): Promise<Metadata> {
  const id = parseId((await params).id);
  const item = id ? await getItem(id).catch(() => null) : null;
  return { title: item?.title ?? "Story" };
}

async function Article({ params }: Pick<PageProps<"/item/[id]">, "params">) {
  const id = parseId((await params).id);
  if (!id) notFound();

  const data = await getStoryWithComments(id);
  if (!data || !data.item.title) notFound();

  const { item, comments } = data;
  const preview = item.url ? await getLinkPreview(item.url) : null;
  const total = countComments(comments);

  return (
    <article className="article">
      <header className="article__header">
        <p className="kicker">{kickerFor(item)}</p>
        <h1 className="article__headline">{item.title}</h1>
        {preview?.description && <p className="article__dek">{preview.description}</p>}
        <p className="byline">
          {item.by && (
            <span>
              By{" "}
              <a href={`https://news.ycombinator.com/user?id=${item.by}`} target="_blank" rel="noopener noreferrer">
                {item.by}
              </a>
            </span>
          )}
          <time dateTime={new Date(item.time * 1000).toISOString()}>{articleDate(item.time)}</time>
          {item.type !== "job" && <span>{plural(item.score ?? 0, "point")}</span>}
        </p>
      </header>

      {item.url && <LinkPreviewCard url={item.url} preview={preview} />}

      {item.text && (
        <div className="article__body prose" dangerouslySetInnerHTML={{ __html: sanitizeHN(item.text) }} />
      )}

      {item.type !== "job" && (
        <section className="article__comments" id="comments">
          <div className="comments-header">
            <h2 className="rule-heading">{plural(total, "Comment")}</h2>
            <a
              href={`https://news.ycombinator.com/item?id=${item.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="comments-header__hn"
            >
              Join the discussion on Hacker News →
            </a>
          </div>
          <CommentThread comments={comments} />
        </section>
      )}

      <p className="article__back">
        <Link href="/">← Back to the Front Page</Link>
      </p>
    </article>
  );
}

function ArticleSkeleton() {
  return (
    <div className="skeleton skeleton--article" aria-busy="true" aria-label="Loading story">
      <div className="skeleton__line skeleton__line--kicker" />
      <div className="skeleton__line skeleton__line--headline" />
      <div className="skeleton__line skeleton__line--headline short" />
      <div className="skeleton__block skeleton__block--lead" />
    </div>
  );
}

export default function ItemPage({ params }: PageProps<"/item/[id]">) {
  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <Article params={params} />
    </Suspense>
  );
}
