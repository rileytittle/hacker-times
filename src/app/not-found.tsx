import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-found">
      <p className="kicker">Corrections</p>
      <h1 className="article__headline">We couldn&rsquo;t find that story.</h1>
      <p>
        It may have been deleted, or the link may be wrong. <Link href="/">Return to the Front Page</Link>.
      </p>
    </div>
  );
}
