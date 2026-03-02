"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { ApplicantCard } from "./ApplicantCard";
import { ApplicationDrawer } from "./ApplicationDrawer";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApplicationStatus } from "@/lib/applications/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
function trackEvent(event: string, properties?: Record<string, unknown>) {
  fetch("/api/recruiter/intelligence/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, properties }),
  }).catch(() => {});
}

interface ApplicantItem {
  id: string;
  applicantName: string | null;
  applicantAvatar: string | null;
  applicantHeadline: string | null;
  applicantLocation: string | null;
  applicantProfileUrl: string | null;
  fitScoreSnapshot: number | null;
  submittedAt: string;
  status: ApplicationStatus;
}

interface RecruiterApplicationsClientProps {
  jobId: number;
  jobTitle: string;
  companyName: string;
}

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "INTERVIEW_SCHEDULED", label: "Interview" },
  { value: "OFFERED", label: "Offered" },
  { value: "REJECTED", label: "Rejected" },
];

export function RecruiterApplicationsClient({
  jobId,
}: RecruiterApplicationsClientProps) {
  const [applications, setApplications] = useState<ApplicantItem[]>([]);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState<"date" | "fitScore">("date");
  const [loading, setLoading] = useState(true);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fitExplainerId, setFitExplainerId] = useState<string | null>(null);
  const [scorecardId, setScorecardId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20", sort });
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/jobs/${jobId}/applications?` + params.toString());
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
    }
    setLoading(false);
  }, [jobId, page, statusFilter, sort]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const handleViewApplication = (id: string) => {
    setDrawerId(id);
    setDrawerOpen(true);
  };
  const handleOpenFitExplainer = (id: string) => {
    trackEvent("fit_explainer_opened", { applicationId: id });
    setFitExplainerId(id);
  };
  const handleOpenScorecard = (id: string) => {
    setScorecardId(id);
  };

  const { data: fitExplanation } = useSWR(
    fitExplainerId
      ? `/api/recruiter/intelligence/fit-explanation?applicationId=${encodeURIComponent(fitExplainerId)}`
      : null,
    fetcher
  );
  const { data: scorecardsData, mutate: mutateScorecards } = useSWR(
    scorecardId
      ? `/api/recruiter/intelligence/scorecards?jobApplicationId=${encodeURIComponent(scorecardId)}`
      : null,
    fetcher
  );

  const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
    const res = await fetch(`/api/applications/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) await fetchApps();
  };

  const handleBulkStatus = async (status: ApplicationStatus) => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    const res = await fetch(`/api/jobs/${jobId}/applications/bulk-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationIds: Array.from(selectedIds),
        status,
      }),
    });
    if (res.ok) {
      setSelectedIds(new Set());
      await fetchApps();
    }
    setBulkLoading(false);
  };

  const shortlisted = statusCounts.SHORTLISTED ?? 0;
  const interview = statusCounts.INTERVIEW_SCHEDULED ?? 0;

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <span>Total applicants: <strong>{total}</strong></span>
        <span>Shortlisted: <strong>{shortlisted}</strong></span>
        <span>Interview: <strong>{interview}</strong></span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 border-b border-border">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value || "all"}
              type="button"
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                statusFilter === tab.value ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">Sort:</span>
          <button
            type="button"
            className={`text-sm ${sort === "date" ? "font-medium" : "text-muted-foreground"}`}
            onClick={() => setSort("date")}
          >
            Date
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            type="button"
            className={`text-sm ${sort === "fitScore" ? "font-medium" : "text-muted-foreground"}`}
            onClick={() => setSort("fitScore")}
          >
            Fit Score
          </button>
        </div>
      </div>
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded border border-border bg-muted/30 p-2">
          <span className="text-sm">{selectedIds.size} selected</span>
          <Button size="sm" variant="outline" disabled={bulkLoading} onClick={() => handleBulkStatus("SHORTLISTED")}>
            Move to Shortlisted
          </Button>
          <Button size="sm" variant="outline" disabled={bulkLoading} onClick={() => handleBulkStatus("REJECTED")}>
            Reject Selected
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
        </div>
      )}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="ascend-card p-8 text-center text-muted-foreground">
          No applications yet for this job.
        </div>
      ) : (
        <ul className="space-y-3">
          {applications.map((app) => (
            <li key={app.id}>
              <div className="flex items-center gap-2">
                {(app.status === "SUBMITTED" || app.status === "UNDER_REVIEW") && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(app.id)}
                    onChange={(e) => {
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(app.id);
                        else next.delete(app.id);
                        return next;
                      });
                    }}
                  />
                )}
                <ApplicantCard
                  id={app.id}
                  applicantName={app.applicantName}
                  applicantAvatar={app.applicantAvatar}
                  applicantHeadline={app.applicantHeadline}
                  applicantLocation={app.applicantLocation}
                  applicantProfileUrl={app.applicantProfileUrl}
                  fitScoreSnapshot={app.fitScoreSnapshot}
                  submittedAt={app.submittedAt}
                  status={app.status}
                  onViewApplication={handleViewApplication}
                  onStatusChange={handleStatusChange}
                  onOpenFitExplainer={handleOpenFitExplainer}
                  onOpenScorecard={handleOpenScorecard}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="flex items-center px-2 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
      <ApplicationDrawer
        applicationId={drawerId}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setDrawerId(null); }}
        onStatusUpdated={fetchApps}
      />
      <Sheet open={!!fitExplainerId} onOpenChange={(open) => !open && setFitExplainerId(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Fit score breakdown</SheetTitle>
          </SheetHeader>
          {fitExplanation && !fitExplanation.error && (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">{fitExplanation.candidateName} · Overall: {fitExplanation.overallScore}%</p>
              <div className="space-y-3">
                {fitExplanation.breakdown && Object.entries(fitExplanation.breakdown).map(([key, d]) => {
                  const dim = d as { score: number; max: number; label: string };
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{dim.label}</span>
                        <span>{dim.score} / {dim.max}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(dim.score / dim.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {fitExplanation.topStrengths?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Strengths</p>
                  <ul className="text-sm text-muted-foreground list-disc pl-4">
                    {fitExplanation.topStrengths.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {fitExplanation.topGaps?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Gaps</p>
                  <ul className="text-sm text-muted-foreground list-disc pl-4">
                    {fitExplanation.topGaps.map((g: string, i: number) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {fitExplanation?.error && (
            <p className="text-sm text-muted-foreground mt-4">{fitExplanation.error}</p>
          )}
        </SheetContent>
      </Sheet>
      <ScorecardSheet
        applicationId={scorecardId}
        open={!!scorecardId}
        onClose={() => setScorecardId(null)}
        scorecardsData={scorecardsData}
        onSaved={(id) => { mutateScorecards(); trackEvent("scorecard_submitted", { applicationId: id }); }}
      />
    </div>
  );
}

const RECOMMENDATIONS = ["STRONG_YES", "YES", "UNDECIDED", "NO", "STRONG_NO"] as const;

function ScorecardSheet({
  applicationId,
  open,
  onClose,
  scorecardsData,
  onSaved,
}: {
  applicationId: string | null;
  open: boolean;
  onClose: () => void;
  scorecardsData: { scorecards?: unknown[]; averageScores?: Record<string, number> } | null;
  onSaved: (applicationId: string) => void;
}) {
  const [technical, setTechnical] = useState<number[]>([3]);
  const [communication, setCommunication] = useState<number[]>([3]);
  const [culture, setCulture] = useState<number[]>([3]);
  const [problemSolving, setProblemSolving] = useState<number[]>([3]);
  const [overall, setOverall] = useState<number[]>([3]);
  const [notes, setNotes] = useState("");
  const [recommendation, setRecommendation] = useState<string>("UNDECIDED");
  const [saving, setSaving] = useState(false);
  const [viewAll, setViewAll] = useState(false);

  const handleSave = async () => {
    if (!applicationId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/recruiter/intelligence/scorecards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobApplicationId: applicationId,
          technicalScore: technical[0],
          communicationScore: communication[0],
          cultureScore: culture[0],
          problemSolvingScore: problemSolving[0],
          overallScore: overall[0],
          notes: notes.slice(0, 2000) || null,
          recommendation,
        }),
      });
      if (res.ok) onSaved(applicationId);
    } finally {
      setSaving(false);
    }
  };

  const scorecards = scorecardsData?.scorecards ?? [];
  const avg = scorecardsData?.averageScores;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{viewAll ? "All scorecards" : "Interview scorecard"}</SheetTitle>
        </SheetHeader>
        {!viewAll ? (
          <div className="mt-4 space-y-4">
            {[
              { label: "Technical", value: technical[0], set: (v: number) => setTechnical([v]) },
              { label: "Communication", value: communication[0], set: (v: number) => setCommunication([v]) },
              { label: "Culture fit", value: culture[0], set: (v: number) => setCulture([v]) },
              { label: "Problem solving", value: problemSolving[0], set: (v: number) => setProblemSolving([v]) },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <Label className="text-xs">{label} (1–5)</Label>
                <select
                  value={value}
                  onChange={(e) => set(Number(e.target.value))}
                  className="mt-1 rounded border border-input bg-background px-2 py-1 text-sm w-full"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            ))}
            <div>
              <Label className="text-xs">Overall (1–5)</Label>
              <select
                value={overall[0]}
                onChange={(e) => setOverall([Number(e.target.value)])}
                className="mt-1 rounded border border-input bg-background px-2 py-1 text-sm w-full"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Notes (max 2000)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 2000))}
                maxLength={2000}
                rows={3}
                className="mt-1"
              />
              <span className="text-xs text-muted-foreground">{notes.length}/2000</span>
            </div>
            <div>
              <Label className="text-xs block mb-2">Recommendation</Label>
              <div className="flex flex-wrap gap-2">
                {RECOMMENDATIONS.map((r) => (
                  <label key={r} className="flex items-center gap-1 text-sm">
                    <input
                      type="radio"
                      name="recommendation"
                      checked={recommendation === r}
                      onChange={() => setRecommendation(r)}
                    />
                    {r.replace(/_/g, " ")}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save scorecard"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setViewAll(true)}>
                View all scorecards
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <Button size="sm" variant="ghost" onClick={() => setViewAll(false)}>
              ← Back to form
            </Button>
            {avg && (
              <div className="text-sm rounded-lg bg-muted p-3">
                <p className="font-medium mb-1">Average scores</p>
                <p className="text-muted-foreground">
                  Technical {avg.technicalScore?.toFixed(1)} · Communication {avg.communicationScore?.toFixed(1)} · Culture {avg.cultureScore?.toFixed(1)} · Problem solving {avg.problemSolvingScore?.toFixed(1)} · Overall {avg.overallScore?.toFixed(1)}
                </p>
              </div>
            )}
            {scorecards.map((s) => {
              const sc = s as { id: string; recruiterName: string | null; overallScore: number | null; recommendation: string; notes: string | null };
              return (
                <div key={sc.id} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{sc.recruiterName ?? "Recruiter"}</p>
                  <p className="text-muted-foreground">Overall: {sc.overallScore ?? "—"} · {sc.recommendation.replace(/_/g, " ")}</p>
                  {sc.notes && <p className="mt-1 text-muted-foreground">{sc.notes}</p>}
                </div>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
