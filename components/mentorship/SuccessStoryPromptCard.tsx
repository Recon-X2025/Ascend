"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : null));

export function SuccessStoryPromptCard() {
  const { data, mutate } = useSWR<{ success: boolean; data: Array<{ outcomeId: string; transitionType: string; hasStory: boolean }> }>(
    "/api/mentorship/success-stories",
    fetcher
  );
  const [creating, setCreating] = useState<string | null>(null);
  const [includeEmployer, setIncludeEmployer] = useState(false);

  const eligible = (data?.data ?? []).filter((o) => !o.hasStory);
  if (eligible.length === 0) return null;

  const handleCreate = async (outcomeId: string) => {
    setCreating(outcomeId);
    try {
      const res = await fetch("/api/mentorship/success-stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcomeId, includeEmployer }),
      });
      const json = await res.json();
      if (res.ok && json.slug) {
        window.open(`/stories/${json.slug}`, "_blank");
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
          <Sparkles className="h-4 w-4" /> Share your success
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground">
          Turn your verified outcome into a shareable success story.
        </p>
        {eligible.map((o) => (
          <div key={o.outcomeId} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] p-3">
            <span className="text-sm font-medium">{o.transitionType}</span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={includeEmployer}
                  onChange={(e) => setIncludeEmployer(e.target.checked)}
                />
                Include employer
              </label>
              <Button
                size="sm"
                onClick={() => handleCreate(o.outcomeId)}
                disabled={creating === o.outcomeId}
              >
                {creating === o.outcomeId ? "Creating…" : "Create story"}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
