"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SignalCard, type SignalType } from "@/components/feed/SignalCard";
import { Rss } from "lucide-react";

type Signal = {
  id: string;
  type: string;
  actor: { id: string; name: string | null; image: string | null; headline: string | null; currentRole: string | null; username: string | null } | null;
  company: { id: string; slug: string; name: string } | null;
  jobPost: { id: number; slug: string; title: string } | null;
  metadata: Record<string, unknown> | null;
  seen: boolean;
  createdAt: string;
};

export function FeedPreview() {
  const [signals, setSignals] = useState<Signal[]>([]);

  useEffect(() => {
    fetch("/api/feed?limit=3")
      .then((r) => r.json())
      .then((d) => d.success && setSignals((d.data ?? []).slice(0, 3)));
  }, []);

  return (
    <div className="ascend-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rss className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Career updates</h2>
        </div>
        <Link href="/feed" className="text-sm text-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="mt-3 space-y-2">
        {signals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Career updates from your network will appear here.
          </p>
        ) : (
          signals.map((s) => (
            <SignalCard
              key={s.id}
              id={s.id}
              type={s.type as SignalType}
              actor={s.actor}
              company={s.company}
              jobPost={s.jobPost}
              metadata={s.metadata}
              seen={s.seen}
              createdAt={s.createdAt}
            />
          ))
        )}
      </div>
    </div>
  );
}
