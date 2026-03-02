"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import useSWR from "swr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FunnelChart } from "@/components/admin/analytics/FunnelChart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function trackEvent(event: string, properties?: Record<string, unknown>) {
  fetch("/api/recruiter/intelligence/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, properties }),
  }).catch(() => {});
}

export function IntelligenceClient() {
  const [companyId, setCompanyId] = useState<string>("");
  const [jobPostId, setJobPostId] = useState<string>("");
  const [period, setPeriod] = useState<string>("90d");

  const { data: context } = useSWR("/api/recruiter/intelligence/context", fetcher);
  const companies = useMemo(() => context?.companies ?? [], [context?.companies]);
  const jobs = useMemo(() => context?.jobs ?? [], [context?.jobs]);

  useEffect(() => {
    if (companies.length > 0 && !companyId) setCompanyId(companies[0].id);
    if (jobs.length > 0 && !jobPostId) setJobPostId(String(jobs[0].id));
  }, [companies, jobs, companyId, jobPostId]);

  const timeToHireUrl =
    companyId &&
    `/api/recruiter/intelligence/time-to-hire?companyId=${encodeURIComponent(companyId)}&period=${period}`;
  const { data: timeToHire } = useSWR(timeToHireUrl || null, fetcher);

  const funnelUrl =
    jobPostId && `/api/recruiter/intelligence/funnel?jobPostId=${encodeURIComponent(jobPostId)}`;
  const { data: funnel } = useSWR(funnelUrl || null, fetcher);

  const handleFunnelJobSelect = useCallback((jid: string) => {
    setJobPostId(jid);
    trackEvent("funnel_viewed", { jobPostId: jid });
  }, []);

  const benchmarkUrl =
    jobPostId && `/api/recruiter/intelligence/benchmark?jobPostId=${encodeURIComponent(jobPostId)}`;
  const { data: benchmark } = useSWR(benchmarkUrl || null, fetcher);

  const handleBenchmarkJobSelect = useCallback((jid: string) => {
    setJobPostId(jid);
    trackEvent("benchmark_viewed", { jobPostId: jid });
  }, []);

  const diMetricsUrl =
    jobPostId && `/api/recruiter/intelligence/di-metrics?jobPostId=${encodeURIComponent(jobPostId)}`;
  const { data: diMetrics, mutate: mutateDi } = useSWR(diMetricsUrl || null, fetcher);

  const [diToggling, setDiToggling] = useState(false);
  const selectedJob = jobs.find((j: { id: number }) => String(j.id) === jobPostId);
  const diCompanyId = selectedJob?.companyId ?? "";
  const diEnabled = diMetrics?.enabled === true;

  const handleEnableDi = async (enabled: boolean) => {
    if (!diCompanyId) return;
    setDiToggling(true);
    try {
      const res = await fetch("/api/recruiter/intelligence/di-metrics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: diCompanyId, enabled }),
      });
      if (res.ok) {
        if (enabled) trackEvent("di_metrics_enabled", { companyId: diCompanyId });
        await mutateDi();
      }
    } finally {
      setDiToggling(false);
    }
  };

  const barData =
    timeToHire?.companyAvg && timeToHire?.platformBenchmark?.benchmarkAvailable !== false
      ? [
          { stage: "First view", company: timeToHire.companyAvg.daysToFirstView, platform: timeToHire.platformBenchmark.daysToFirstView },
          { stage: "Shortlist", company: timeToHire.companyAvg.daysToShortlist, platform: timeToHire.platformBenchmark.daysToShortlist },
          { stage: "Interview", company: timeToHire.companyAvg.daysToInterview, platform: timeToHire.platformBenchmark.daysToInterview },
          { stage: "Offer", company: timeToHire.companyAvg.daysToOffer, platform: timeToHire.platformBenchmark.daysToOffer },
          { stage: "Hire", company: timeToHire.companyAvg.daysToHire, platform: timeToHire.platformBenchmark.daysToHire },
        ]
      : timeToHire?.companyAvg
        ? [
            { stage: "First view", company: timeToHire.companyAvg.daysToFirstView, platform: 0 },
            { stage: "Shortlist", company: timeToHire.companyAvg.daysToShortlist, platform: 0 },
            { stage: "Interview", company: timeToHire.companyAvg.daysToInterview, platform: 0 },
            { stage: "Offer", company: timeToHire.companyAvg.daysToOffer, platform: 0 },
            { stage: "Hire", company: timeToHire.companyAvg.daysToHire, platform: 0 },
          ]
        : [];

  const funnelSteps =
    funnel?.stages?.map((s: { stage: string; count: number; dropOffPct: number | null }) => ({
      label: s.stage.replace(/_/g, " "),
      value: s.count,
      pct: 100 - (s.dropOffPct ?? 0),
    })) ?? [];

  const onTabChange = (value: string) => {
    if (value === "di") trackEvent("di_metrics_viewed");
  };

  return (
    <Tabs defaultValue="time-to-hire" className="mt-6" onValueChange={onTabChange}>
      <TabsList className="flex flex-wrap gap-1">
        <TabsTrigger value="time-to-hire">Time to Hire</TabsTrigger>
        <TabsTrigger value="funnel">Funnel</TabsTrigger>
        <TabsTrigger value="benchmark">Benchmarking</TabsTrigger>
        <TabsTrigger value="di">D&I Metrics</TabsTrigger>
      </TabsList>

      <TabsContent value="time-to-hire" className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c: { id: string; name: string }) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="180d">180 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {timeToHire?.benchmarkAvailable === false && (
          <p className="text-sm text-muted-foreground">Platform benchmark requires at least 5 comparable hires across 3+ companies.</p>
        )}
        {barData.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Company vs platform (avg days per stage)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    />
                    <Legend />
                    <Bar dataKey="company" name="Your company" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    {timeToHire?.platformBenchmark?.benchmarkAvailable !== false && (
                      <Bar dataKey="platform" name="Platform avg" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {timeToHire?.trend?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Avg days to hire by month</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={timeToHire.trend} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                      />
                      <Line type="monotone" dataKey="avgDaysToHire" stroke="hsl(var(--primary))" strokeWidth={2} name="Avg days" dot />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            {timeToHire?.byRole?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">By role</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 font-medium">Role</th>
                          <th className="text-right py-2 font-medium">Avg days to hire</th>
                          <th className="text-right py-2 font-medium">Hires</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timeToHire.byRole.map((r: { roleTitle: string; avgDaysToHire: number; hireCount: number }) => (
                          <tr key={r.roleTitle} className="border-b border-border/50">
                            <td className="py-2">{r.roleTitle}</td>
                            <td className="text-right">{r.avgDaysToHire.toFixed(1)}</td>
                            <td className="text-right">{r.hireCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
        {timeToHireUrl && !timeToHire?.companyAvg && !timeToHire?.error && (
          <p className="text-muted-foreground">No hired (offered) applications in this period.</p>
        )}
      </TabsContent>

      <TabsContent value="funnel" className="space-y-4">
        <Select value={jobPostId} onValueChange={handleFunnelJobSelect}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select job" />
          </SelectTrigger>
          <SelectContent>
            {jobs.map((j: { id: number; title: string }) => (
              <SelectItem key={j.id} value={String(j.id)}>{j.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {funnel?.jobTitle && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{funnel.jobTitle} — Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <FunnelChart steps={funnelSteps} />
              </CardContent>
            </Card>
            {funnel.stages?.some((s: { suggestion: string | null }) => s.suggestion) && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Suggestions</p>
                {funnel.stages
                  .filter((s: { suggestion: string | null }) => s.suggestion)
                  .map((s: { stage: string; suggestion: string }) => (
                    <Card key={s.stage}>
                      <CardContent className="py-3 text-sm">{s.suggestion}</CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </>
        )}
      </TabsContent>

      <TabsContent value="benchmark" className="space-y-4">
        <Select value={jobPostId} onValueChange={handleBenchmarkJobSelect}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select job" />
          </SelectTrigger>
          <SelectContent>
            {jobs.map((j: { id: number; title: string }) => (
              <SelectItem key={j.id} value={String(j.id)}>{j.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {benchmark?.thisJob && (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">This job</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Applicants: <strong>{benchmark.thisJob.applicantCount}</strong></p>
                  <p>Avg fit score: <strong>{benchmark.thisJob.avgApplicantFitScore}</strong></p>
                  <p>Salary: {benchmark.thisJob.salaryMin ?? "—"} – {benchmark.thisJob.salaryMax ?? "—"}</p>
                  <p>Requirements: <strong>{benchmark.thisJob.requirementCount}</strong></p>
                  <p>Work mode: {benchmark.thisJob.workMode}</p>
                </CardContent>
              </Card>
              {benchmark.platformAvg && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Platform average (same title)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>Applicants: <strong>{benchmark.platformAvg.applicantCount}</strong></p>
                    <p>Avg fit score: <strong>{benchmark.platformAvg.avgApplicantFitScore}</strong></p>
                    <p>Salary: {benchmark.platformAvg.salaryMin ?? "—"} – {benchmark.platformAvg.salaryMax ?? "—"}</p>
                    <p>Requirements: <strong>{benchmark.platformAvg.requirementCount}</strong></p>
                    <p>Work mode: {benchmark.platformAvg.workMode}</p>
                  </CardContent>
                </Card>
              )}
            </div>
            {benchmark.differentials?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Differentials</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {benchmark.differentials.map((d: { metric: string; pctDifference: number; suggestion: string | null }) => (
                    <Card
                      key={d.metric}
                      className={
                        d.pctDifference >= 0
                          ? "border-green-500/30"
                          : d.pctDifference >= -15
                            ? "border-amber-500/30"
                            : "border-red-500/30"
                      }
                    >
                      <CardContent className="py-3">
                        <p className="text-sm font-medium capitalize">{d.metric.replace(/([A-Z])/g, " $1").trim()}: {d.pctDifference >= 0 ? "+" : ""}{d.pctDifference.toFixed(1)}%</p>
                        {d.suggestion && <p className="text-xs text-muted-foreground mt-1">{d.suggestion}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {benchmark.benchmarkAvailable === false && (
              <p className="text-sm text-muted-foreground">Platform benchmark requires at least 5 comparable jobs across 3+ companies.</p>
            )}
          </>
        )}
      </TabsContent>

      <TabsContent value="di" className="space-y-4">
        {diMetrics && diMetrics.enabled === false && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">D&I metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Enable anonymised diversity and inclusion metrics (location, education, and optional gender distribution) for your company. Data is aggregated only; no individual data is shown. Minimum 10 applicants per stage required.
              </p>
              <button
                type="button"
                disabled={!diCompanyId || diToggling}
                onClick={() => handleEnableDi(true)}
                className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {diToggling ? "Saving…" : "Enable D&I metrics"}
              </button>
            </CardContent>
          </Card>
        )}
        {diEnabled && (
          <>
            <Select value={jobPostId} onValueChange={setJobPostId}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select job" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((j: { id: number; title: string }) => (
                  <SelectItem key={j.id} value={String(j.id)}>{j.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {diMetrics?.insufficient && (
              <p className="text-sm text-amber-600">Minimum 10 records per stage required. Not enough data for this job yet.</p>
            )}
            {diMetrics?.stages?.map((stage: { stage: string; locationDistribution: Record<string, number>; educationDistribution: Record<string, number>; totalCount: number }) => (
              <Card key={stage.stage}>
                <CardHeader>
                  <CardTitle className="text-base">{stage.stage}</CardTitle>
                  <p className="text-xs text-muted-foreground">Total: {stage.totalCount}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Location (city)</p>
                    <div className="space-y-1">
                      {Object.entries(stage.locationDistribution)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([city, count]) => (
                          <div key={city} className="flex justify-between text-sm">
                            <span>{city}</span>
                            <span className="text-muted-foreground">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Education</p>
                    <div className="space-y-1">
                      {Object.entries(stage.educationDistribution)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([edu, count]) => (
                          <div key={edu} className="flex justify-between text-sm">
                            <span>{edu}</span>
                            <span className="text-muted-foreground">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {diCompanyId && (
              <button
                type="button"
                onClick={() => handleEnableDi(false)}
                disabled={diToggling}
                className="text-sm text-muted-foreground hover:underline"
              >
                Disable D&I metrics for this company
              </button>
            )}
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}
