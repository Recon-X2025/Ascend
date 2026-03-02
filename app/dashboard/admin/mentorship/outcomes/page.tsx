"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type OutcomeRow = {
  id: string;
  contractId: string;
  mentorName: string | null;
  menteeName: string | null;
  transitionType: string;
  claimedOutcome: string;
  mentorReflection: string | null;
  status: string;
  submittedAt: string;
  menteeDisputedAt: string | null;
  menteeNote: string | null;
  opsDecision: string | null;
  opsNote: string | null;
};

type ListRes = {
  items: OutcomeRow[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
};

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export default function AdminMentorshipOutcomesPage() {
  const [tab, setTab] = useState<"disputed" | "all">("disputed");
  const [selectedRow, setSelectedRow] = useState<OutcomeRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [decision, setDecision] = useState<"UPHELD" | "OVERTURNED" | "">("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const disputedUrl = "/api/admin/mentorship/outcomes?status=DISPUTED";
  const allUrl =
    statusFilter && statusFilter !== "all"
      ? `/api/admin/mentorship/outcomes?status=${statusFilter}&limit=50`
      : `/api/admin/mentorship/outcomes?limit=50`;

  const { data: disputedData, mutate: mutateDisputed } = useSWR<ListRes>(
    tab === "disputed" ? disputedUrl : null,
    fetcher
  );
  const { data: allData, mutate: mutateAll } = useSWR<ListRes>(
    tab === "all" ? allUrl : null,
    fetcher
  );

  const disputedItems = disputedData?.items ?? [];
  const allItems = allData?.items ?? [];

  const handleCloseSheet = (open: boolean) => {
    if (!open) {
      setSelectedRow(null);
      setDecision("");
      setNote("");
    }
    setSheetOpen(open);
  };

  const handleOpsReview = async () => {
    if (!selectedRow || !decision || !note.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/mentorship/outcomes/${selectedRow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ops-review", decision, note: note.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Request failed");
      }
      mutateDisputed();
      mutateAll();
      handleCloseSheet(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const exportCsv = () => {
    const rows = tab === "disputed" ? disputedItems : allItems;
    const headers = [
      "id",
      "contractId",
      "mentorName",
      "menteeName",
      "transitionType",
      "status",
      "submittedAt",
      "menteeDisputedAt",
      "menteeNote",
      "opsDecision",
    ];
    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => {
          const v = (r as Record<string, unknown>)[h];
          const s = typeof v === "string" ? v : v == null ? "" : String(v);
          return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        }).join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `outcomes-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Outcome verification</h1>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "disputed" | "all")}>
        <TabsList>
          <TabsTrigger value="disputed">Disputed outcomes</TabsTrigger>
          <TabsTrigger value="all">All outcomes</TabsTrigger>
        </TabsList>

        <TabsContent value="disputed" className="mt-4">
          {disputedItems.length === 0 ? (
            <p className="text-muted-foreground">No disputed outcomes.</p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Mentee</th>
                    <th className="text-left p-3 font-medium">Mentor</th>
                    <th className="text-left p-3 font-medium">Transition</th>
                    <th className="text-left p-3 font-medium">Disputed at</th>
                    <th className="text-left p-3 font-medium">Days since</th>
                  </tr>
                </thead>
                <tbody>
                  {disputedItems.map((row) => {
                    const days = daysSince(row.menteeDisputedAt);
                    return (
                      <tr
                        key={row.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedRow(row);
                          setSheetOpen(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedRow(row);
                            setSheetOpen(true);
                          }
                        }}
                        className="border-t hover:bg-muted/30 cursor-pointer"
                      >
                        <td className="p-3">{row.menteeName ?? "—"}</td>
                        <td className="p-3">{row.mentorName ?? "—"}</td>
                        <td className="p-3">{row.transitionType}</td>
                        <td className="p-3">
                          {row.menteeDisputedAt
                            ? new Date(row.menteeDisputedAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="p-3">{days != null ? days : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Status</Label>
              <Select
                value={statusFilter || "all"}
                onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PENDING_MENTEE">Pending mentee</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="DISPUTED">Disputed</SelectItem>
                  <SelectItem value="UNACKNOWLEDGED">Unacknowledged</SelectItem>
                  <SelectItem value="OPS_REVIEWED">Ops reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              Export CSV
            </Button>
          </div>
          {allItems.length === 0 ? (
            <p className="text-muted-foreground">No outcomes match.</p>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Mentee</th>
                    <th className="text-left p-3 font-medium">Mentor</th>
                    <th className="text-left p-3 font-medium">Transition</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {allItems.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t hover:bg-muted/30"
                    >
                      <td className="p-3">{row.menteeName ?? "—"}</td>
                      <td className="p-3">{row.mentorName ?? "—"}</td>
                      <td className="p-3">{row.transitionType}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-xs bg-muted">
                          {row.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {new Date(row.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={sheetOpen} onOpenChange={handleCloseSheet}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Disputed outcome</SheetTitle>
          </SheetHeader>
          {selectedRow && (
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mentor claim</p>
                <p className="mt-1 text-sm">{selectedRow.claimedOutcome}</p>
                {selectedRow.transitionType && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Transition: {selectedRow.transitionType}
                  </p>
                )}
                {selectedRow.mentorReflection && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Reflection: {selectedRow.mentorReflection}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mentee dispute note</p>
                <p className="mt-1 text-sm">{selectedRow.menteeNote ?? "—"}</p>
              </div>
              <div>
                <Link
                  href={`/mentorship/engagements/${selectedRow.contractId}`}
                  className="text-sm text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View contract →
                </Link>
              </div>
              <div className="pt-4 border-t space-y-3">
                <Label>Decision</Label>
                <Select value={decision} onValueChange={(v) => setDecision(v as "UPHELD" | "OVERTURNED")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPHELD">Upheld (mentor claim stands)</SelectItem>
                    <SelectItem value="OVERTURNED">Overturned (mentee dispute upheld)</SelectItem>
                  </SelectContent>
                </Select>
                <div>
                  <Label>Note (required)</Label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Reason for decision..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleOpsReview}
                  disabled={!decision || !note.trim() || submitting}
                >
                  {submitting ? "Submitting…" : "Submit review"}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
