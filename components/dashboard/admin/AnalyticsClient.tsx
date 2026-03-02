"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewLineChart } from "@/components/admin/analytics/OverviewLineChart";
import { PersonaDonut } from "@/components/admin/analytics/PersonaDonut";
import { FunnelChart } from "@/components/admin/analytics/FunnelChart";
import { PersonaCard } from "@/components/admin/analytics/PersonaCard";
import { FeatureUsageTable } from "@/components/admin/analytics/FeatureUsageTable";
import { PERSONA_LABELS } from "@/components/admin/analytics/PersonaColors";
import {
  Users,
  UserPlus,
  Activity,
  Briefcase,
  FileCheck,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function AnalyticsClient() {
  const [funnelDays, setFunnelDays] = useState(30);

  const { data: overview, isLoading: overviewLoading } = useSWR(
    "/api/admin/analytics/overview",
    fetcher,
    { refreshInterval: 60000 }
  );
  const { data: funnel, isLoading: funnelLoading } = useSWR(
    `/api/admin/analytics/funnel?days=${funnelDays}`,
    fetcher,
    { refreshInterval: 60000 }
  );
  const { data: personas } = useSWR(
    "/api/admin/analytics/personas?days=30",
    fetcher,
    { refreshInterval: 60000 }
  );
  const { data: features, isLoading: featuresLoading } = useSWR(
    "/api/admin/analytics/features",
    fetcher,
    { refreshInterval: 60000 }
  );

  const latest = overview?.latest;
  const snapshots = overview?.snapshots ?? [];

  const lineData = snapshots.map((s: { date: string; newUsersToday: number }) => ({
    date: s.date,
    total: s.newUsersToday,
  }));

  const donutData = latest
    ? [
        { name: "ACTIVE_SEEKER", value: latest.activeSeekersCount ?? 0, fill: "#16A34A" },
        { name: "PASSIVE_SEEKER", value: latest.passiveSeekersCount ?? 0, fill: "#2563EB" },
        { name: "EARLY_CAREER", value: latest.earlyCareerCount ?? 0, fill: "#9333EA" },
        { name: "RECRUITER", value: latest.recruiterCount ?? 0, fill: "#EA580C" },
        { name: "NO_PERSONA", value: latest.noPersonaCount ?? 0, fill: "#94A3B8" },
      ].filter((d) => d.value > 0)
    : [];

  const funnelSteps = funnel
    ? [
        { label: "Registered", value: funnel.registered ?? 0, pct: 100 },
        {
          label: "Persona selected",
          value: funnel.personaCompleted ?? 0,
          pct: funnel.registrationToPersona ?? 0,
        },
        {
          label: "Context completed",
          value: funnel.contextCompleted ?? 0,
          pct: funnel.personaToContext ?? 0,
        },
        {
          label: "First job view",
          value: funnel.firstJobView ?? 0,
          pct: funnel.contextToJobView ?? 0,
        },
        {
          label: "First application",
          value: funnel.firstApplication ?? 0,
          pct: funnel.overallConversion ?? 0,
        },
      ]
    : [];

  const personaList = ["ACTIVE_SEEKER", "PASSIVE_SEEKER", "EARLY_CAREER", "RECRUITER"];
  const totalUsers = personas?.totalUsers ?? 0;

  const statTiles = [
    { label: "Total Users", value: latest?.totalUsers ?? 0, icon: Users },
    { label: "New Today", value: latest?.newUsersToday ?? 0, icon: UserPlus },
    { label: "Active (7d)", value: latest?.activeUsersWeek ?? 0, icon: Activity },
    { label: "Active (30d)", value: latest?.activeUsersMonth ?? 0, icon: Activity },
    { label: "Total Jobs", value: latest?.activeJobPostings ?? 0, icon: Briefcase },
    { label: "Applications Today", value: latest?.applicationsToday ?? 0, icon: FileCheck },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-muted-foreground text-sm">Platform metrics and cohort analytics</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="personas">Personas</TabsTrigger>
          <TabsTrigger value="health">Platform Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {statTiles.map(({ label, value, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                  <p className="text-2xl font-semibold mt-1">
                    {overviewLoading ? "—" : value.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daily new users (last 30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <div className="h-80 bg-muted animate-pulse rounded" />
              ) : (
                <OverviewLineChart data={lineData} />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Persona distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {overviewLoading || donutData.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  {overviewLoading ? "Loading…" : "No data"}
                </div>
              ) : (
                <PersonaDonut data={donutData} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-6 mt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-sm font-medium">Period:</span>
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setFunnelDays(d)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  funnelDays === d ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                }`}
              >
                Last {d} days
              </button>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversion funnel</CardTitle>
            </CardHeader>
            <CardContent>
              {funnelLoading ? (
                <div className="h-64 bg-muted animate-pulse rounded" />
              ) : (
                <FunnelChart steps={funnelSteps} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personas" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {personaList.map((p) => (
              <PersonaCard
                key={p}
                persona={p}
                stats={personas?.personas?.[p] ?? { count: 0, avgCompletionScore: 0, avgSessionsPerUser: 0, avgJobApplications: 0, retentionRate7d: 0, retentionRate30d: 0, topFeatures: [] }}
                totalUsers={totalUsers}
              />
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Persona comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Metric</th>
                      {personaList.map((p) => (
                        <th key={p} className="text-right py-2 font-medium">
                          {PERSONA_LABELS[p] ?? p}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Count</td>
                      {personaList.map((p) => (
                        <td key={p} className="text-right py-2">
                          {(personas?.personas?.[p]?.count ?? 0).toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Avg completion</td>
                      {personaList.map((p) => (
                        <td key={p} className="text-right py-2">
                          {personas?.personas?.[p]?.avgCompletionScore ?? "—"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Avg applications</td>
                      {personaList.map((p) => (
                        <td key={p} className="text-right py-2">
                          {personas?.personas?.[p]?.avgJobApplications ?? "—"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">7d retention %</td>
                      {personaList.map((p) => (
                        <td key={p} className="text-right py-2">
                          {personas?.personas?.[p]?.retentionRate7d ?? "—"}%
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">30d retention %</td>
                      {personaList.map((p) => (
                        <td key={p} className="text-right py-2">
                          {personas?.personas?.[p]?.retentionRate30d ?? "—"}%
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Feature usage (last 30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              {featuresLoading ? (
                <div className="h-48 bg-muted animate-pulse rounded" />
              ) : (
                <FeatureUsageTable rows={features?.features ?? []} />
              )}
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground font-medium">Jobs Indexed</p>
                <p className="text-xl font-semibold mt-1">
                  {(latest?.jobsIndexedTotal ?? 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground font-medium">Active Job Posts</p>
                <p className="text-xl font-semibold mt-1">
                  {(latest?.activeJobPostings ?? 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground font-medium">Applications Today</p>
                <p className="text-xl font-semibold mt-1">
                  {(latest?.applicationsToday ?? 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground font-medium">Fit scores (30d)</p>
                <p className="text-xl font-semibold mt-1">
                  {(latest?.fitScoresRunToday ?? 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground font-medium">Resume optimisations (30d)</p>
                <p className="text-xl font-semibold mt-1">
                  {(latest?.resumeOptimisationsToday ?? 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
