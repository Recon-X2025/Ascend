"use client";

import { useState, useEffect } from "react";

type Kind = "pendingConnections" | "unreadMessages" | "unseenSignals";

interface Counts {
  pendingConnections: number;
  unreadMessages: number;
  unseenSignals: number;
}

export function NavBadges({ kind }: { kind: Kind }) {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    fetch("/api/network/counts")
      .then((r) => r.json())
      .then(setCounts)
      .catch(() => {});
  }, []);

  const count = counts ? counts[kind] : 0;
  if (count === 0) return null;

  return (
    <span className="min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center">
      {count > 99 ? "99+" : count}
    </span>
  );
}
