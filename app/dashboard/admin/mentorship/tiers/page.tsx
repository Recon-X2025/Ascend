"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type MentorRow = {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  tier: string;
  verifiedOutcomeCount: number;
  disputeRate: number;
  activeMenteeCount: number;
  maxActiveMentees: number;
  tierOverriddenByAdmin: boolean;
  tierUpdatedAt: string | null;
};

type HistoryEntry = {
  previousTier: string;
  newTier: string;
  reason: string;
  createdAt: string;
};

const REASON_LABELS: Record<string, string> = {
  WEEKLY_CALC: "Automatic weekly recalculation",
  OUTCOME_VERIFIED: "New verified outcome",
  ADMIN_OVERRIDE: "Manual adjustment by Ascend team",
  DEMOTION_DISPUTE_RATE: "Dispute rate exceeded threshold",
  DEMOTION_VERIFICATION_LAPSED: "Verification period lapsed",
};

export default function AdminMentorshipTiersPage() {
  const [tierFilter, setTierFilter] = useState("");
  const [overrideFilter, setOverrideFilter] = useState("");
  const [highDispute, setHighDispute] = useState(false);
  const [selected, setSelected] = useState<MentorRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [overrideTier, setOverrideTier] = useState<"RISING" | "ESTABLISHED" | "ELITE">("RISING");
  const [overrideNote, setOverrideNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const params = new URLSearchParams();
  if (tierFilter) params.set("tier", tierFilter);
  if (overrideFilter) params.set("override", overrideFilter);
  if (highDispute) params.set("highDispute", "true");

  const { data, mutate } = useSWR<{
    mentors: MentorRow[];
    lastCronRun: string | null;
    cronSummary: { mentorsProcessed?: number; tiersChanged?: number; promotions?: number; demotions?: number } | null;
  }>(`/api/admin/mentorship/tiers?${params}`, fetcher);

  const { data: historyData } = useSWR<{ history: HistoryEntry[] }>(
    selected ? `/api/mentorship/mentors/${selected.id}/tier-history` : null,
    fetcher
  );

  const mentors = data?.mentors ?? [];
  const lastCronRun = data?.lastCronRun;
  const cronSummary = data?.cronSummary;

  const handleOverride = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/mentorship/mentors/${selected.id}/tier`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: overrideTier, note: overrideNote.trim() || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      mutate();
      setSheetOpen(false);
      setSelected(null);
      setOverrideNote("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveOverride = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/mentorship/mentors/${selected.id}/tier-override`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      mutate();
      setSheetOpen(false);
      setSelected(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mentor tiers</h1>

      {lastCronRun && (
        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
          <strong>Weekly calc</strong>: Last run {new Date(lastCronRun).toLocaleString()}
          {cronSummary && (
            <span className="ml-2 text-muted-foreground">
              — {cronSummary.mentorsProcessed ?? 0} processed, {cronSummary.tiersChanged ?? 0} changed
              ({cronSummary.promotions ?? 0} promotions, {cronSummary.demotions ?? 0} demotions)
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <div>
          <Label className="text-xs">Tier</Label>
          <Select value={tierFilter || "all"} onValueChange={(v) => setTierFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="RISING">Rising</SelectItem>
              <SelectItem value="ESTABLISHED">Established</SelectItem>
              <SelectItem value="ELITE">Elite</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Override</Label>
          <Select value={overrideFilter || "all"} onValueChange={(v) => setOverrideFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            checked={highDispute}
            onChange={(e) => setHighDispute(e.target.checked)}
          />
          <span className="text-sm">Dispute rate &gt;25%</span>
        </label>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Tier</th>
              <th className="text-left p-3 font-medium">Verified</th>
              <th className="text-left p-3 font-medium">Dispute %</th>
              <th className="text-left p-3 font-medium">Mentees</th>
              <th className="text-left p-3 font-medium">Override</th>
              <th className="text-left p-3 font-medium">Last change</th>
            </tr>
          </thead>
          <tbody>
            {mentors.map((m) => (
              <tr
                key={m.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelected(m);
                  setOverrideTier(m.tier as "RISING" | "ESTABLISHED" | "ELITE");
                  setSheetOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(m);
                    setSheetOpen(true);
                  }
                }}
                className="border-t hover:bg-muted/30 cursor-pointer"
              >
                <td className="p-3">{m.name ?? "—"}</td>
                <td className="p-3">{m.tier}</td>
                <td className="p-3">{m.verifiedOutcomeCount}</td>
                <td className="p-3">{(m.disputeRate * 100).toFixed(0)}%</td>
                <td className="p-3">{m.activeMenteeCount} / {m.maxActiveMentees}</td>
                <td className="p-3">{m.tierOverriddenByAdmin ? "Y" : "—"}</td>
                <td className="p-3">{m.tierUpdatedAt ? new Date(m.tierUpdatedAt).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selected?.name ?? "Mentor"} — Tier</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="font-medium mb-2">Tier history</h3>
                {(historyData?.history ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No history.</p>
                ) : (
                  <ul className="text-sm space-y-1">
                    {(historyData?.history ?? []).map((h, i) => (
                      <li key={i}>
                        {h.previousTier} → {h.newTier}: {REASON_LABELS[h.reason] ?? h.reason} ({new Date(h.createdAt).toLocaleDateString()})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="pt-4 border-t space-y-3">
                <Label>Override tier</Label>
                <Select value={overrideTier} onValueChange={(v) => setOverrideTier(v as "RISING" | "ESTABLISHED" | "ELITE")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RISING">Rising</SelectItem>
                    <SelectItem value="ESTABLISHED">Established</SelectItem>
                    <SelectItem value="ELITE">Elite</SelectItem>
                  </SelectContent>
                </Select>
                <div>
                  <Label>Note</Label>
                  <Textarea
                    value={overrideNote}
                    onChange={(e) => setOverrideNote(e.target.value)}
                    placeholder="Reason for override..."
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleOverride} disabled={submitting}>
                    {submitting ? "Saving…" : "Save override"}
                  </Button>
                  {selected.tierOverriddenByAdmin && (
                    <Button variant="outline" onClick={handleRemoveOverride} disabled={submitting}>
                      Remove override
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
