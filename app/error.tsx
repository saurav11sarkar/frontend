"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="empty-state standalone">
      <h1>Something interrupted your visit.</h1>
      <p className="muted">Please try again, or return to your collection.</p>
      <div className="button-row">
        <button className="button primary" onClick={reset}>
          Try again
        </button>
        <Link className="button secondary" href="/books">
          Back to collection
        </Link>
      </div>
    </section>
  );
}
