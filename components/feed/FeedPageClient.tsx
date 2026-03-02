"use client";

import { useState, useEffect } from "react";
import { SignalCard, type SignalType } from "./SignalCard";
import { Button } from "@/components/ui/button";

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

export function FeedPageClient() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = () => {
    fetch("/api/feed?includeSeen=true")
      .then((r) => r.json())
      .then((d) => d.success && setSignals(d.data ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const markAllSeen = async () => {
    setMarkingAll(true);
    await fetch("/api/feed/mark-all-seen", { method: "POST" });
    load();
    setMarkingAll(false);
  };

  if (loading) {
    return <div className="h-48 bg-muted rounded-xl animate-pulse" />;
  }

  if (signals.length === 0) {
    return (
      <p className="text-muted-foreground">
        Career updates from your network will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={markAllSeen} disabled={markingAll}>
          Mark all as seen
        </Button>
      </div>
      <div className="space-y-3">
        {signals.map((s) => (
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
        ))}
      </div>
    </div>
  );
}
