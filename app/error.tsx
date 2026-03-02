"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-ink">Something went wrong</h1>
      <p className="mt-2 text-ink-3">
        We could not load this page. You can try again or go home.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-green text-white px-4 py-2 text-sm font-medium hover:bg-green-dark transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-surface-2 transition-colors"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
