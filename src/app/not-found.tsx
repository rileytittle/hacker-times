import Link from "next/link";

export default function NotFound() {
  return (
    <div className="list-page not-found">
      <h1 className="page-title">Nothing here</h1>
      <p>
        That story or page doesn&rsquo;t exist, or it was deleted. <Link href="/">Back to Top stories</Link>
      </p>
    </div>
  );
}
