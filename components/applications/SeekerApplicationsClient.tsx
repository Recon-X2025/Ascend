"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ApplicationCard } from "./ApplicationCard";

type Status = "SUBMITTED" | "UNDER_REVIEW" | "SHORTLISTED" | "INTERVIEW_SCHEDULED" | "OFFERED" | "REJECTED" | "WITHDRAWN";

interface AppItem {
  id: string;
  jobPostId: number;
  jobTitle: string;
  jobSlug: string;
  companyName: string | null;
  companyLogo: string | null;
  resumeVersion: { id: string; name: string } | null;
  submittedAt: string;
  status: Status;
  fitScoreSnapshot: number | null;
}

const TABS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "INTERVIEW_SCHEDULED", label: "Interview" },
  { value: "OFFERED", label: "Offered" },
  { value: "REJECTED", label: "Rejected" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

export function SeekerApplicationsClient() {
  const [applications, setApplications] = useState<AppItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [withdrawId, setWithdrawId] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch("/api/applications?" + params.toString());
    const data = await res.json();
    if (res.ok) {
      setApplications(data.applications ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
      setStatusCounts(data.statusCounts ?? {});
    } else {
      setApplications([]);
      setTotal(0);
      setTotalPages(0);
      setStatusCounts({});
    }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const handleWithdraw = async (id: string) => {
    setWithdrawId(id);
    try {
      const res = await fetch(`/api/applications/${id}/withdraw`, { method: "POST" });
      if (res.ok) await fetchApps();
    } finally {
      setWithdrawId(null);
    }
  };

  const confirmWithdraw = (id: string) => {
    if (typeof window !== "undefined" && window.confirm("Are you sure you want to withdraw this application?")) {
      handleWithdraw(id);
    }
  };

  const underReview = statusCounts.UNDER_REVIEW ?? 0;
  const shortlisted = statusCounts.SHORTLISTED ?? 0;
  const interview = statusCounts.INTERVIEW_SCHEDULED ?? 0;
  const offered = statusCounts.OFFERED ?? 0;

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="text-muted-foreground">Total: <strong>{total}</strong></span>
        <span>Under Review: <strong>{underReview}</strong></span>
        <span>Shortlisted: <strong>{shortlisted}</strong></span>
        <span>Interview: <strong>{interview}</strong></span>
        <span>Offered: <strong>{offered}</strong></span>
      </div>
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.value || "all"}
            type="button"
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              statusFilter === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="ascend-card p-8 text-center text-muted-foreground">
          <p>No applications yet.</p>
          <Link href="/jobs">
            <Button variant="link" className="mt-2">Browse Jobs →</Button>
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {applications.map((app) => (
              <li key={app.id}>
                <ApplicationCard
                  id={app.id}
                  jobTitle={app.jobTitle}
                  jobSlug={app.jobSlug}
                  companyName={app.companyName}
                  companyLogo={app.companyLogo}
                  submittedAt={app.submittedAt}
                  status={app.status}
                  fitScoreSnapshot={app.fitScoreSnapshot}
                  resumeVersionName={app.resumeVersion?.name ?? null}
                  onWithdraw={confirmWithdraw}
                  withdrawLoading={withdrawId === app.id}
                />
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-2 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
