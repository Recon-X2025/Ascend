"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ProfileCompletenessWidget() {
  const [missing, setMissing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mentorship/profile/complete")
      .then((r) => r.json())
      .then((d) => {
        if (d.missingFields) setMissing(d.missingFields);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || missing.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 mb-6">
      <p className="font-medium text-ink mb-2">Complete your mentor profile</p>
      <p className="text-sm text-ink-3 mb-2">
        Missing: {missing.slice(0, 5).join(", ")}{missing.length > 5 ? "…" : ""}
      </p>
      <Link href="/mentorship/become-a-mentor">
        <Button size="sm">Complete your mentor profile</Button>
      </Link>
    </div>
  );
}
