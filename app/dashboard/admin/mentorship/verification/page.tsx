"use client";

import { useState } from "react";
import useSWR from "swr";
import { VerificationReviewPanel, type VerificationRow } from "@/components/mentorship/VerificationReviewPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Tab = "pending" | "needs_info" | "verified" | "rejected";

export default function AdminMentorshipVerificationPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [selectedRow, setSelectedRow] = useState<VerificationRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const statusMap: Record<Tab, string> = {
    pending: "PENDING",
    needs_info: "NEEDS_INFO",
    verified: "VERIFIED",
    rejected: "REJECTED",
  };
  const status = statusMap[tab];
  const { data, mutate } = useSWR<{ items: VerificationRow[]; total: number }>(
    `/api/admin/mentorship/verification?status=${status}`,
    fetcher
  );

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mentor verification</h1>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="needs_info">Needs Info</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {items.length === 0 ? (
            <p className="text-muted-foreground">No submissions in this tab.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((row) => (
                <li
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
                  className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {(row.mentorName ?? "?")[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{row.mentorName ?? "—"}</p>
                    <p className="text-sm text-muted-foreground truncate">{row.headline}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Submitted {row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "—"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium px-2 py-1 rounded ${
                      row.slaIndicator === "green"
                        ? "bg-green/10 text-green"
                        : row.slaIndicator === "amber"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                    }`}
                  >
                    {row.slaIndicator === "green"
                      ? "< 24h"
                      : row.slaIndicator === "amber"
                      ? "24–36h"
                      : "> 36h"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <VerificationReviewPanel
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        row={selectedRow}
        onDecisionSubmitted={mutate}
      />
    </div>
  );
}
