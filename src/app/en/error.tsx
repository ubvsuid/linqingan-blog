"use client";

import Link from "next/link";

export default function EnglishErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="not-found" lang="en">
      <div className="container">
        <p className="eyebrow">TEMPORARY ERROR</p>
        <h1>The English section could not load</h1>
        <p>Try the request again. If the problem continues, use site search or report the affected page through the public issue tracker.</p>
        <div className="button-row">
          <button type="button" className="button button-primary" onClick={reset}>Try again</button>
          <Link href="/en/search" className="button button-secondary">Search the site</Link>
          <Link href="/en/about" className="button button-secondary">Report a problem</Link>
        </div>
      </div>
    </main>
  );
}
