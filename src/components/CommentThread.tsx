import { countComments, type Comment } from "@/lib/hn";
import { articleDate } from "@/lib/format";
import { sanitizeHN } from "@/lib/sanitize";

export function CommentThread({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) {
    return <p className="empty">No comments yet. Be the first to weigh in on Hacker News.</p>;
  }
  return (
    <ol className="comments">
      {comments.map((c) => (
        <CommentNode key={c.id} comment={c} />
      ))}
    </ol>
  );
}

function CommentNode({ comment }: { comment: Comment }) {
  const replies = countComments(comment.children);
  return (
    <li className="comment" id={`c${comment.id}`}>
      {/* <details> gives collapsible threads without any client JS. */}
      <details open>
        <summary className="comment__meta">
          <span className="comment__author">{comment.by}</span>
          <a href={`#c${comment.id}`} className="comment__time">
            {articleDate(comment.time)}
          </a>
          <span className="comment__toggle" data-count={replies + 1} aria-hidden />
        </summary>
        <div className="comment__text prose" dangerouslySetInnerHTML={{ __html: sanitizeHN(comment.text) }} />
        {comment.children.length > 0 && (
          <ol className="comments comments--nested">
            {comment.children.map((c) => (
              <CommentNode key={c.id} comment={c} />
            ))}
          </ol>
        )}
      </details>
    </li>
  );
}
