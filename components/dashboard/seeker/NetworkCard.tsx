"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users } from "lucide-react";

export function NetworkCard() {
  const [counts, setCounts] = useState<{ pendingConnections: number } | null>(null);
  const [suggestionsCount, setSuggestionsCount] = useState<number>(0);

  useEffect(() => {
    fetch("/api/network/counts")
      .then((r) => r.json())
      .then((d) => setCounts(d))
      .catch(() => {});
    fetch("/api/connections/suggestions")
      .then((r) => r.json())
      .then((d) => d.success && setSuggestionsCount((d.data ?? []).length))
      .catch(() => {});
  }, []);

  const pending = counts?.pendingConnections ?? 0;

  return (
    <div className="ascend-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Your Network</h2>
        </div>
        <Link href="/network" className="text-sm text-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
        {pending > 0 && (
          <p>
            <span className="font-medium text-foreground">{pending}</span> pending request{pending !== 1 ? "s" : ""}
          </p>
        )}
        {suggestionsCount > 0 && (
          <p>
            <span className="font-medium text-foreground">{suggestionsCount}</span> people who can help you get there
          </p>
        )}
        {pending === 0 && suggestionsCount === 0 && (
          <p>Find people who can help you get there.</p>
        )}
      </div>
    </div>
  );
}
