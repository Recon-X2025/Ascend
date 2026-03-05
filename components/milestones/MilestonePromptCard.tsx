"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : null));

export function MilestonePromptCard() {
  const { data, mutate } = useSWR<{
    success: boolean;
    data: {
      contracts: Array<{ contractId: string; transitionType: string | null }>;
      tiers: Array<{ tierHistoryId: string; newTier: string }>;
    };
  }>("/api/milestones", fetcher);
  const [creating, setCreating] = useState<string | null>(null);

  const contracts = data?.data?.contracts ?? [];
  const tiers = data?.data?.tiers ?? [];
  const hasAny = contracts.length > 0 || tiers.length > 0;
  if (!hasAny) return null;

  const handleCreate = async (type: string, id: string) => {
    const key = `${type}:${id}`;
    setCreating(key);
    try {
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          type === "CONTRACT_COMPLETED" ? { type, contractId: id } : { type, tierHistoryId: id }
        ),
      });
      const json = await res.json();
      if (res.ok && json.slug) {
        window.open(`/milestones/${json.slug}`, "_blank");
        mutate();
      }
    } finally {
      setCreating(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Trophy className="h-4 w-4" /> Share your milestone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground">
          Turn your career win into a shareable card.
        </p>
        {contracts.map((c) => (
          <div
            key={c.contractId}
            className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] p-3"
          >
            <span className="text-sm">
              Completed {c.transitionType ?? "mentorship"}
            </span>
            <Button
              size="sm"
              onClick={() => handleCreate("CONTRACT_COMPLETED", c.contractId)}
              disabled={creating === `CONTRACT_COMPLETED:${c.contractId}`}
            >
              {creating === `CONTRACT_COMPLETED:${c.contractId}` ? "Creating…" : "Create card"}
            </Button>
          </div>
        ))}
        {tiers.map((t) => (
          <div
            key={t.tierHistoryId}
            className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] p-3"
          >
            <span className="text-sm">Reached {t.newTier} tier</span>
            <Button
              size="sm"
              onClick={() => handleCreate("TIER_ACHIEVED", t.tierHistoryId)}
              disabled={creating === `TIER_ACHIEVED:${t.tierHistoryId}`}
            >
              {creating === `TIER_ACHIEVED:${t.tierHistoryId}` ? "Creating…" : "Create card"}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
