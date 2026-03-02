"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const REJECTION_REASONS = [
  "Inappropriate language",
  "Unverifiable claim",
  "Personal information included",
  "Spam or duplicate",
  "Does not meet quality guidelines",
];

type ReviewType = "company" | "interview" | "salary";

type ReviewItem = {
  id: string;
  type: ReviewType;
  companyName: string;
  companySlug: string;
  authorEmail: string;
  authorName: string | null;
  headline: string;
  preview: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  submittedHoursAgo: number;
};

export function AdminModerationClient() {
  const [filter, setFilter] = useState<"PENDING" | "ALL">("PENDING");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [rejectItem, setRejectItem] = useState<{ id: string; type: ReviewType } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectOther, setRejectOther] = useState("");

  const { data: stats, mutate: mutateStats } = useSWR<{
    pending: number;
    approvedToday: number;
    rejectedToday: number;
  }>("/api/admin/moderation/stats", fetcher, { refreshInterval: 30000 });

  const url = `/api/admin/moderation?filter=${filter}&type=${typeFilter}`;
  const { data, mutate } = useSWR<{
    reviews: ReviewItem[];
    nextCursor: string | null;
    hasMore: boolean;
  }>(url, fetcher);

  const getApproveUrl = (id: string, type: ReviewType) => {
    if (type === "company") return `/api/admin/moderation/reviews/${id}/approve`;
    if (type === "interview") return `/api/admin/moderation/interview/${id}/approve`;
    return `/api/admin/moderation/salary/${id}/approve`;
  };

  const getRejectUrl = (id: string, type: ReviewType) => {
    if (type === "company") return `/api/admin/moderation/reviews/${id}/reject`;
    if (type === "interview") return `/api/admin/moderation/interview/${id}/reject`;
    return `/api/admin/moderation/salary/${id}/reject`;
  };

  const handleApprove = async (id: string, type: ReviewType) => {
    const res = await fetch(getApproveUrl(id, type), { method: "PATCH" });
    if (res.ok) {
      mutate();
      mutateStats();
    } else {
      alert((await res.json().catch(() => ({}))).error ?? "Failed");
    }
  };

  const handleReject = async () => {
    if (!rejectItem) return;
    const reason = rejectReason === "Other" ? rejectOther.trim() : rejectReason;
    if (reason.length < 5) return;
    const res = await fetch(getRejectUrl(rejectItem.id, rejectItem.type), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) {
      setRejectItem(null);
      setRejectReason("");
      setRejectOther("");
      mutate();
      mutateStats();
    } else {
      alert((await res.json().catch(() => ({}))).error ?? "Failed");
    }
  };

  const reviews = data?.reviews ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Moderation</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-3xl font-bold">{stats?.pending ?? 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Approved today</p>
          <p className="text-3xl font-bold">{stats?.approvedToday ?? 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Rejected today</p>
          <p className="text-3xl font-bold">{stats?.rejectedToday ?? 0}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "PENDING" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("PENDING")}
        >
          Pending
        </Button>
        <Button
          variant={filter === "ALL" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("ALL")}
        >
          All
        </Button>
        <span className="px-2 text-muted-foreground">|</span>
        {(["all", "company", "interview", "salary"] as const).map((t) => (
          <Button
            key={t}
            variant={typeFilter === t ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter(t)}
          >
            {t === "all"
              ? "All"
              : t === "company"
                ? "Company Reviews"
                : t === "interview"
                  ? "Interview Reviews"
                  : "Salary Data"}
          </Button>
        ))}
      </div>

      {filter === "PENDING" && reviews.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <p className="font-medium">No pending reviews. Queue is clear.</p>
        </div>
      )}

      <div className="space-y-4">
        {reviews.map((r) => (
          <div
            key={`${r.type}-${r.id}`}
            className={`rounded-lg border bg-card p-4 space-y-3 ${r.submittedHoursAgo >= 24 ? "border-destructive/50" : ""}`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Link
                href={`/companies/${r.companySlug}`}
                className="font-semibold text-primary hover:underline"
              >
                {r.companyName}
              </Link>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {r.type === "company"
                    ? "Company"
                    : r.type === "interview"
                      ? "Interview"
                      : "Salary"}
                </Badge>
                <Badge
                  variant={
                    r.status === "APPROVED"
                      ? "default"
                      : r.status === "REJECTED"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {r.status}
                </Badge>
              </div>
            </div>
            <p className="text-sm font-medium">{r.headline}</p>
            {r.preview && (
              <p className="text-sm text-muted-foreground line-clamp-2">{r.preview}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Submitted by {r.authorEmail}
              {r.submittedHoursAgo >= 24 && (
                <span className="text-destructive ml-2">
                  · Submitted {r.submittedHoursAgo}h ago
                </span>
              )}
              {r.submittedHoursAgo < 24 && r.submittedHoursAgo >= 0 && (
                <span className="ml-2">· Submitted {r.submittedHoursAgo}h ago</span>
              )}
            </p>
            {r.status === "PENDING" && (
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  size="sm"
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(r.id, r.type)}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setRejectItem({ id: r.id, type: r.type })}
                >
                  Reject
                </Button>
                {rejectItem?.id === r.id && rejectItem?.type === r.type && (
                  <div className="w-full flex flex-col gap-2 pt-2 border-t">
                    <select
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    >
                      <option value="">Select reason</option>
                      {REJECTION_REASONS.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                    {rejectReason === "Other" && (
                      <textarea
                        className="min-h-[60px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                        placeholder="Please specify (min 5 chars)"
                        value={rejectOther}
                        onChange={(e) => setRejectOther(e.target.value)}
                      />
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setRejectItem(null);
                          setRejectReason("");
                          setRejectOther("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleReject}
                        disabled={
                          rejectReason.length < 2 ||
                          (rejectReason === "Other" && rejectOther.trim().length < 5)
                        }
                      >
                        Confirm reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {data?.hasMore && (
        <Button variant="outline">Load more</Button>
      )}
    </div>
  );
}
