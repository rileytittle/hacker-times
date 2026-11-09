import { countComments, type Comment } from "@/lib/hn";
import { fullTimestamp, htmlToText, plural, timeAgo, truncate } from "@/lib/format";
import { sanitizeHN } from "@/lib/sanitize";

interface Ctx {
  op?: string;
  asOf: number;
}

/**
 * Server-rendered comment tree. Interactivity (collapse, keyboard nav,
 * "new since last visit") is layered on by <ThreadControls>, which uses
 * event delegation on the data-action / data-time attributes rendered here.
 */
export function Comments({ comments, op, asOf }: { comments: Comment[] } & Ctx) {
  if (comments.length === 0) {
    return <p className="empty">No comments yet.</p>;
  }
  return (
    <ol className="thread" data-thread>
      {comments.map((c) => (
        <CommentNode key={c.id} comment={c} ctx={{ op, asOf }} depth={0} />
      ))}
    </ol>
  );
}

function CommentNode({ comment, ctx, depth }: { comment: Comment; ctx: Ctx; depth: number }) {
  const replies = countComments(comment.children);
  const isOp = !!ctx.op && comment.by === ctx.op;
  return (
    <li
      className={`comment${depth === 0 ? " comment--root" : ""}`}
      id={`c${comment.id}`}
      data-comment
      data-time={comment.time}
      data-depth={depth}
      tabIndex={-1}
    >
      <button
        type="button"
        className="comment__rail"
        data-action="toggle"
        aria-label={`Collapse comment by ${comment.by}`}
      />
      <div className="comment__header">
        <a
          className={`comment__author${isOp ? " comment__author--op" : ""}`}
          href={`https://news.ycombinator.com/user?id=${comment.by}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {comment.by}
        </a>
        {isOp && (
          <span className="badge" title="Original poster">
            OP
          </span>
        )}
        <a className="comment__time" href={`#c${comment.id}`} title={fullTimestamp(comment.time)}>
          {timeAgo(comment.time, ctx.asOf)}
        </a>
        <span className="badge badge--new">new</span>
        <button type="button" className="comment__toggle" data-action="toggle" aria-expanded="true">
          <span className="comment__toggle-open">hide</span>
          <span className="comment__toggle-closed">
            show{replies > 0 && ` +${replies} ${replies === 1 ? "reply" : "replies"}`}
          </span>
        </button>
      </div>
      <div className="comment__body prose" dangerouslySetInnerHTML={{ __html: sanitizeHN(comment.text) }} />
      {comment.children.length > 0 && (
        <ol className="comment__children">
          {comment.children.map((c) => (
            <CommentNode key={c.id} comment={c} ctx={ctx} depth={depth + 1} />
          ))}
        </ol>
      )}
    </li>
  );
}

/** Sidebar index of top-level threads, for jumping around long discussions. */
export function ThreadOutline({ comments, op }: { comments: Comment[]; op?: string }) {
  if (comments.length < 2) return null;
  return (
    <nav className="outline" aria-label="Thread outline">
      <p className="outline__heading">{plural(comments.length, "thread")}</p>
      <ol>
        {comments.map((c) => {
          const replies = countComments(c.children);
          return (
            <li key={c.id}>
              <a href={`#c${c.id}`}>
                <span className="outline__author">
                  {c.by}
                  {op && c.by === op && <span className="badge">OP</span>}
                  {replies > 0 && <span className="outline__replies">{replies}</span>}
                </span>
                <span className="outline__snippet">{truncate(htmlToText(c.text), 90)}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
