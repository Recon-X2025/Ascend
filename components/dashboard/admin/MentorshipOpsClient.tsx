"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileText, Users, ClipboardList, Bell, Scale, BarChart3, TrendingUp, TrendingDown, Wallet, IndianRupee, Gavel } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function TrendBadge({ delta }: { delta: number | null }) {
  if (delta === null || delta === undefined) return null;
  const isUp = delta > 0;
  const isDown = delta < 0;
  const isRate = Math.abs(delta) < 2 && delta !== 0;
  const label = isRate ? `${(delta * 100).toFixed(1)}%` : (isUp ? `+${delta}` : `${delta}`);
  return (
    <span className={`text-xs flex items-center gap-0.5 ${isUp ? "text-green-600" : isDown ? "text-red-600" : "text-muted-foreground"}`}>
      {isUp && <TrendingUp className="h-3 w-3" />}
      {isDown && <TrendingDown className="h-3 w-3" />}
      {label}
    </span>
  );
}

function PlatformAnalyticsTab({
  overview,
  snapshots,
  transitions,
  disputeByTier,
}: {
  overview: { snapshot: Record<string, unknown> | null; delta7d: Record<string, unknown> | null; delta30d: Record<string, unknown> | null } | undefined;
  snapshots: Array<Record<string, unknown>>;
  transitions: Array<{ transition: string; engagements: number; verifiedOutcomes: number; outcomeRate: number; avgDays: number }>;
  disputeByTier: Record<string, number>;
}) {
  const snapshot = overview?.snapshot as Record<string, unknown> | null | undefined;
  const delta7d = overview?.delta7d as Record<string, unknown> | null | undefined;
  const hasEnoughData = snapshots.length >= 4;

  const metricCards = [
    { key: "activeEngagements", label: "Active Engagements", delta: delta7d?.activeEngagements as number | null },
    { key: "outcomeVerificationRate", label: "Outcome verification rate", rate: true, delta: delta7d?.outcomeVerificationRate as number | null },
    { key: "avgTimeToOutcomeDays", label: "Avg time to outcome (days)", delta: delta7d?.avgTimeToOutcomeDays as number | null },
    { key: "avgDisputeRate", label: "Avg mentor dispute rate", rate: true, delta: delta7d?.avgDisputeRate as number | null },
    { key: "sessionsCompletedThisWeek", label: "Sessions this week", delta: delta7d?.sessionsCompletedThisWeek as number | null },
    { key: "milestonesCompletedRate", label: "Milestone completion rate", rate: true, delta: delta7d?.milestonesCompletedRate as number | null },
  ];

  const engagementTrendData = hasEnoughData
    ? snapshots.map((s) => ({
        date: (s.snapshotDate as string)?.slice(0, 10) ?? "",
        active: (s.activeEngagements as number) ?? 0,
        completed: (s.completedEngagementsTotal as number) ?? 0,
      }))
    : [];

  const outcomeFunnelData = snapshot
    ? [
        { name: "Submitted", value: (snapshot.outcomesSubmittedTotal as number) ?? 0 },
        { name: "Verified", value: (snapshot.outcomesVerifiedTotal as number) ?? 0 },
        { name: "Disputed", value: (snapshot.outcomesDisputedTotal as number) ?? 0 },
        { name: "Unacknowledged", value: Math.max(0, ((snapshot.outcomesSubmittedTotal as number) ?? 0) - ((snapshot.outcomesVerifiedTotal as number) ?? 0) - ((snapshot.outcomesDisputedTotal as number) ?? 0)) },
      ].filter((d) => d.value > 0)
    : [];

  const tierDonutData = snapshot?.mentorsByTier
    ? Object.entries(snapshot.mentorsByTier as Record<string, number>).map(([name, value]) => ({ name, value }))
    : [];

  const COLORS = ["#22c55e", "#eab308", "#3b82f6"];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metricCards.map(({ key, label, rate, delta }) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">
                {snapshot?.[key] != null
                  ? rate
                    ? `${((snapshot[key] as number) * 100).toFixed(1)}%`
                    : String(snapshot[key])
                  : "—"}
              </span>
              <div className="mt-1"><TrendBadge delta={delta} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasEnoughData && engagementTrendData.length >= 4 && (
        <Card>
          <CardHeader><CardTitle>Engagement trends (30 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={engagementTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="active" stroke="#3b82f6" name="Active" strokeWidth={2} />
                <Line type="monotone" dataKey="completed" stroke="#22c55e" name="Completed" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {outcomeFunnelData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Outcome funnel</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={outcomeFunnelData} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={55} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {hasEnoughData && snapshots.length >= 4 && (
        <Card>
          <CardHeader><CardTitle>Avg time to outcome trend (30 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={snapshots.map((s) => ({ date: (s.snapshotDate as string)?.slice(0, 10), days: (s.avgTimeToOutcomeDays as number) ?? 0 }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="days" stroke="#f59e0b" name="Days" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {tierDonutData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Tier distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={tierDonutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} label={(e) => `${e.name}: ${e.value}`}>
                  {tierDonutData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Top 10 transitions (by engagements)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transition</TableHead>
                <TableHead>Engagements</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Outcome rate</TableHead>
                <TableHead>Avg days</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transitions.slice(0, 10).map((t) => (
                <TableRow key={t.transition}>
                  <TableCell>{t.transition}</TableCell>
                  <TableCell>{t.engagements}</TableCell>
                  <TableCell>{t.verifiedOutcomes}</TableCell>
                  <TableCell>{(t.outcomeRate * 100).toFixed(0)}%</TableCell>
                  <TableCell>{Math.round(t.avgDays)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {transitions.length === 0 && <p className="text-muted-foreground py-4">No transition data yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Dispute rate by tier</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead>Dispute rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(["RISING", "ESTABLISHED", "ELITE"] as const).map((tier) => {
                const rate = disputeByTier[tier] ?? 0;
                const pct = (rate * 100).toFixed(0);
                const color = rate > 0.25 ? "text-red-600 font-medium" : rate >= 0.1 ? "text-amber-600" : "text-green-600";
                return (
                  <TableRow key={tier}>
                    <TableCell><Badge variant="outline">{tier}</Badge></TableCell>
                    <TableCell><span className={color}>{pct}%</span></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

type Overview = {
  verification: { pending: number; slaBreached: number; averageDaysToDecision: number };
  engagements: { active: number; stalled: number; contractsPendingSignature: number };
  outcomes: {
    pendingMenteeAck: number;
    disputed: number;
    disputeSlaBreached: number;
    verifiedThisMonth: number;
  };
  mentors: {
    total: number;
    highDisputeRate: number;
    lapsedReverification: number;
    tierBreakdown: Record<string, number>;
  };
  alerts: { unread: number; critical: number };
};

export function MentorshipOpsClient() {
  const [tab, setTab] = useState("overview");
  const [auditPage] = useState(0);
  const [alertsResolved, setAlertsResolved] = useState<Set<string>>(new Set());

  const { data: overview, mutate: mutateOverview } = useSWR<Overview>(
    "/api/admin/mentorship/overview",
    fetcher,
    { refreshInterval: 60000 }
  );
  const { data: alertsData, mutate: mutateAlerts } = useSWR<{ items: Array<{
    id: string;
    type: string;
    severity: string;
    entityType: string;
    entityId: string;
    message: string;
    isRead: boolean;
    resolvedAt: string | null;
    createdAt: string;
  }> }>(
    "/api/admin/mentorship/alerts?resolved=false",
    fetcher,
    { refreshInterval: 30000 }
  );
  const { data: engagementsData } = useSWR(
    `/api/admin/mentorship/engagements?page=0&limit=20`,
    fetcher
  );
  const { data: mentorsData } = useSWR(
    `/api/admin/mentorship/mentors?page=0&limit=20`,
    fetcher
  );
  const { data: auditData } = useSWR(
    `/api/admin/mentorship/audit-log?page=${auditPage}&limit=50`,
    fetcher
  );
  const { data: legalDocsData } = useSWR<{ documents: Array<{
    id: string;
    type: string;
    version: string;
    title: string;
    effectiveAt: string;
    totalSignatures: number;
    signedLast7Days: number;
  }> }>(
    tab === "legal" ? "/api/admin/mentorship/legal/documents" : null,
    fetcher
  );
  const { data: allAlertsData } = useSWR<{ items: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    isRead: boolean;
    resolvedAt: string | null;
    createdAt: string;
  }> }>(
    tab === "alerts" ? "/api/admin/mentorship/alerts" : null,
    fetcher
  );
  const { data: analyticsOverview } = useSWR<{
    snapshot: Record<string, unknown> | null;
    delta7d: Record<string, unknown> | null;
    delta30d: Record<string, unknown> | null;
  }>(tab === "analytics" ? "/api/admin/mentorship/analytics/overview" : null, fetcher);
  const { data: analyticsSnapshots } = useSWR<Array<Record<string, unknown>>>(
    tab === "analytics" ? "/api/admin/mentorship/analytics/snapshots?days=30" : null,
    fetcher
  );
  const { data: transitions } = useSWR<Array<{ transition: string; engagements: number; verifiedOutcomes: number; outcomeRate: number; avgDays: number }>>(
    tab === "analytics" ? "/api/admin/mentorship/analytics/transitions" : null,
    fetcher
  );
  const { data: disputeByTier } = useSWR<Record<string, number>>(
    tab === "analytics" ? "/api/admin/mentorship/analytics/dispute-by-tier" : null,
    fetcher
  );
  const { data: revenueData } = useSWR<{
    totalReleasedPaise: number;
    platformFeePaise: number;
    mentorPayoutPaise: number;
    pilotWaivedPaise: number;
    tranchesReleased: number;
    byTier: Record<string, { released: number; platformFee: number; mentorPayout: number }>;
    byPaymentMode: Record<string, { released: number; platformFee: number; mentorPayout: number }>;
  }>(tab === "revenue" ? "/api/admin/mentorship/revenue" : null, fetcher);
  const { data: revenueSnapshots } = useSWR<Array<{
    date: string;
    totalReleasedPaise: number;
    platformFeePaise: number;
    mentorPayoutPaise: number;
    tranchesReleased: number;
  }>>(tab === "revenue" ? "/api/admin/mentorship/revenue/snapshots?days=30" : null, fetcher);
  const { data: tierChangeLog } = useSWR<{ items: Array<{
    id: string;
    action: string;
    entityId: string;
    newState: unknown;
    createdAt: string;
  }> }>(tab === "revenue" ? "/api/admin/mentorship/audit-log?action=TRANCHE_FEE_RECALCULATED_TIER_CHANGE&limit=20" : null, fetcher);
  const { data: disputesData } = useSWR<{
    items: Array<{
      id: string;
      contractId: string;
      mentorName: string;
      menteeName: string;
      milestoneNumber: number;
      trancheNumber: number;
      amountPaise: number;
      category: string;
      status: string;
      outcome: string | null;
      createdAt: string;
      resolvedAt: string | null;
    }>;
    total: number;
    hasMore: boolean;
  }>(tab === "disputes" ? "/api/admin/mentorship/disputes?page=0&limit=50" : null, fetcher);
  const { data: escrowData } = useSWR<{
    items: Array<{
      id: string;
      contractId: string;
      status: string;
      totalAmountPaise: number;
      mentor: { name: string | null; email: string | null };
      mentee: { name: string | null; email: string | null };
      tranches: Array<{ id: string; trancheNumber: number; status: string }>;
    }>;
    total: number;
  }>(tab === "escrow" ? "/api/admin/mentorship/escrow?page=0&limit=50" : null, fetcher);

  const alerts = alertsData?.items ?? [];
  const engagements = engagementsData?.items ?? [];
  const mentors = mentorsData?.items ?? [];
  const auditItems = auditData?.items ?? [];
  const allAlerts = allAlertsData?.items ?? [];

  const resolveAlert = async (id: string) => {
    await fetch(`/api/admin/mentorship/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved: true }),
    });
    setAlertsResolved((s) => new Set(s).add(id));
    mutateAlerts();
    mutateOverview();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mentorship Ops</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/admin/mentorship/verification">
            <Button variant="outline" size="sm">Verification queue</Button>
          </Link>
          <Link href="/dashboard/admin/mentorship/outcomes">
            <Button variant="outline" size="sm">Outcomes</Button>
          </Link>
          <Link href="/dashboard/admin/mentorship/tiers">
            <Button variant="outline" size="sm">Tiers</Button>
          </Link>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            Overview
            {overview?.alerts?.unread ? (
              <Badge variant="destructive" className="ml-1">{overview.alerts.unread}</Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="engagements">
            <ClipboardList className="h-4 w-4" />
            Engagements
          </TabsTrigger>
          <TabsTrigger value="mentors">
            <Users className="h-4 w-4" />
            Mentors
          </TabsTrigger>
          <TabsTrigger value="audit">
            <FileText className="h-4 w-4" />
            Audit Log
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="legal">
            <Scale className="h-4 w-4" />
            Legal
          </TabsTrigger>
          <TabsTrigger value="escrow">
            <Wallet className="h-4 w-4" />
            Escrow
          </TabsTrigger>
          <TabsTrigger value="revenue">
            <IndianRupee className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="disputes">
            <Gavel className="h-4 w-4" />
            Disputes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Active engagements</CardTitle></CardHeader>
              <CardContent><span className="text-2xl font-bold">{overview?.engagements?.active ?? "—"}</span></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Pending verifications</CardTitle></CardHeader>
              <CardContent><span className="text-2xl font-bold">{overview?.verification?.pending ?? "—"}</span></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Disputed outcomes</CardTitle></CardHeader>
              <CardContent><span className="text-2xl font-bold">{overview?.outcomes?.disputed ?? "—"}</span></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Stalled engagements</CardTitle></CardHeader>
              <CardContent><span className="text-2xl font-bold">{overview?.engagements?.stalled ?? "—"}</span></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">High dispute rate mentors</CardTitle></CardHeader>
              <CardContent><span className="text-2xl font-bold">{overview?.mentors?.highDisputeRate ?? "—"}</span></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Unread alerts</CardTitle></CardHeader>
              <CardContent><span className="text-2xl font-bold">{overview?.alerts?.unread ?? "—"}</span></CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Ops alerts</CardTitle></CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-muted-foreground text-sm">No unread alerts.</p>
              ) : (
                <ul className="space-y-2">
                  {alerts.slice(0, 10).map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-4 rounded border p-3 text-sm">
                      <div>
                        <Badge variant={a.severity === "CRITICAL" ? "destructive" : "secondary"} className="mr-2">{a.severity}</Badge>
                        <span>{a.type}</span>
                        <p className="text-muted-foreground truncate mt-0.5">{a.message}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveAlert(a.id)}
                        disabled={alertsResolved.has(a.id)}
                      >
                        {alertsResolved.has(a.id) ? "Resolved" : "Resolve"}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <p className="text-sm text-muted-foreground">
            Verification SLA: {overview?.verification?.slaBreached ?? 0} breached this period. Avg days to decision: {overview?.verification?.averageDaysToDecision ?? "—"}. Dispute SLA breached: {overview?.outcomes?.disputeSlaBreached ?? 0}.
          </p>
        </TabsContent>

        <TabsContent value="engagements" className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mentor</TableHead>
                <TableHead>Mentee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Milestones</TableHead>
                <TableHead>Flags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {engagements.map((e: { id: string; mentorName: string; menteeName: string; engagementType: string; status: string; milestoneProgress: string; flags: { stalled?: boolean; outcomeOverdue?: boolean } }) => (
                <TableRow key={e.id} className={e.flags?.outcomeOverdue ? "bg-destructive/5" : e.flags?.stalled ? "bg-amber-500/5" : undefined}>
                  <TableCell><Link href={`/dashboard/admin/mentorship/engagements/${e.id}`} className="text-primary underline">{e.mentorName}</Link></TableCell>
                  <TableCell>{e.menteeName}</TableCell>
                  <TableCell>{e.engagementType}</TableCell>
                  <TableCell>{e.status}</TableCell>
                  <TableCell>{e.milestoneProgress}</TableCell>
                  <TableCell>
                    {e.flags?.stalled && <Badge variant="secondary" className="mr-1">Stalled</Badge>}
                    {e.flags?.outcomeOverdue && <Badge variant="destructive">Overdue</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {engagements.length === 0 && <p className="text-muted-foreground py-4">No active engagements.</p>}
        </TabsContent>

        <TabsContent value="mentors" className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Verified outcomes</TableHead>
                <TableHead>Dispute rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Flags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mentors.map((m: { id: string; name: string; tier: string; verifiedOutcomes: number; disputeRate: number | null; verificationStatus: string; flags: { highDisputeRate?: boolean; lapsedReverification?: boolean } }) => (
                <TableRow key={m.id}>
                  <TableCell><Link href={`/dashboard/admin/mentorship/mentors/${m.id}`} className="text-primary underline">{m.name}</Link></TableCell>
                  <TableCell><Badge variant="outline">{m.tier}</Badge></TableCell>
                  <TableCell>{m.verifiedOutcomes}</TableCell>
                  <TableCell>
                    <span className={
                      (m.disputeRate ?? 0) > 0.25 ? "text-destructive font-medium" :
                      (m.disputeRate ?? 0) >= 0.1 ? "text-amber-600" : "text-green-600"
                    }>
                      {m.disputeRate != null ? `${(m.disputeRate * 100).toFixed(0)}%` : "—"}
                    </span>
                  </TableCell>
                  <TableCell>{m.verificationStatus}</TableCell>
                  <TableCell>
                    {m.flags?.highDisputeRate && <Badge variant="destructive" className="mr-1">High dispute</Badge>}
                    {m.flags?.lapsedReverification && <Badge variant="secondary">Reverify lapsed</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {mentors.length === 0 && <p className="text-muted-foreground py-4">No mentors.</p>}
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditItems.map((e: { id: string; actorName: string; action: string; category: string; entityType: string; entityId: string; createdAt: string }) => (
                <TableRow key={e.id}>
                  <TableCell>{e.actorName}</TableCell>
                  <TableCell>{e.action}</TableCell>
                  <TableCell>{e.category}</TableCell>
                  <TableCell>{e.entityType} {e.entityId.slice(0, 8)}…</TableCell>
                  <TableCell>{new Date(e.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-sm text-muted-foreground mt-2">
            Export: use Audit Log API with from/to (max 90 days) and download as CSV in your client.
          </p>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <div className="space-y-2">
            {allAlerts.map((a: { id: string; type: string; severity: string; message: string; isRead: boolean; resolvedAt: string | null; createdAt: string }) => (
              <div key={a.id} className="flex items-center justify-between rounded border p-3">
                <div>
                  <Badge variant={a.severity === "CRITICAL" ? "destructive" : "secondary"}>{a.severity}</Badge>
                  <span className="ml-2 text-sm">{a.type}</span>
                  <p className="text-muted-foreground text-sm mt-1">{a.message}</p>
                  <p className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
                {!a.resolvedAt && (
                  <Button size="sm" variant="outline" onClick={() => resolveAlert(a.id)}>Resolve</Button>
                )}
              </div>
            ))}
          </div>
          {allAlerts.length === 0 && <p className="text-muted-foreground">No alerts.</p>}
        </TabsContent>

        <TabsContent value="analytics" className="mt-4 space-y-6">
          <PlatformAnalyticsTab
            overview={analyticsOverview}
            snapshots={analyticsSnapshots ?? []}
            transitions={transitions ?? []}
            disputeByTier={disputeByTier ?? {}}
          />
        </TabsContent>

        <TabsContent value="legal" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Active legal documents</CardTitle></CardHeader>
            <CardContent>
              {legalDocsData?.documents?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Effective</TableHead>
                      <TableHead>Total signatures</TableHead>
                      <TableHead>Signed (7 days)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {legalDocsData.documents.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.type}</TableCell>
                        <TableCell>{d.version}</TableCell>
                        <TableCell>{d.effectiveAt.slice(0, 10)}</TableCell>
                        <TableCell>{d.totalSignatures}</TableCell>
                        <TableCell>{d.signedLast7Days}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">No active documents. Run seed-legal-documents script.</p>
              )}
            </CardContent>
          </Card>
          <p className="text-sm text-muted-foreground mt-2">
            Signature audit: use GET /api/admin/mentorship/legal/signatures with query params userId, type, from, to.
          </p>
        </TabsContent>

        <TabsContent value="escrow" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Escrow accounts</CardTitle></CardHeader>
            <CardContent>
              {escrowData?.items?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Mentor</TableHead>
                      <TableHead>Mentee</TableHead>
                      <TableHead>Tranches</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {escrowData.items.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell><Link href={`/dashboard/admin/mentorship/engagements/${e.contractId}`} className="text-primary underline">{e.contractId.slice(0, 8)}…</Link></TableCell>
                        <TableCell><Badge variant="outline">{e.status}</Badge></TableCell>
                        <TableCell>₹{(e.totalAmountPaise / 100).toLocaleString()}</TableCell>
                        <TableCell>{e.mentor?.name ?? e.mentor?.email ?? "—"}</TableCell>
                        <TableCell>{e.mentee?.name ?? e.mentee?.email ?? "—"}</TableCell>
                        <TableCell>{e.tranches.map((t) => t.status).join(", ")}</TableCell>
                        <TableCell>
                          {e.tranches.some((t) => t.status === "FROZEN") && (
                            <Link href={`/dashboard/admin/mentorship/engagements/${e.contractId}`}>
                              <Button size="sm" variant="outline">Review</Button>
                            </Link>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">No escrow accounts yet.</p>
              )}
              {escrowData && <p className="text-sm text-muted-foreground mt-2">Total: {escrowData.total} escrow(s)</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Escrow disputes</CardTitle></CardHeader>
            <CardContent>
              {disputesData?.items?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mentor</TableHead>
                      <TableHead>Mentee</TableHead>
                      <TableHead>Milestone</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>Filed</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputesData.items.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.mentorName}</TableCell>
                        <TableCell>{d.menteeName}</TableCell>
                        <TableCell>M{d.milestoneNumber} T{d.trancheNumber}</TableCell>
                        <TableCell>₹{(d.amountPaise / 100).toLocaleString()}</TableCell>
                        <TableCell className="text-xs">{d.category.replace(/_/g, " ")}</TableCell>
                        <TableCell><Badge variant="outline">{d.status.replace(/_/g, " ")}</Badge></TableCell>
                        <TableCell>{d.outcome ?? "—"}</TableCell>
                        <TableCell>{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {d.status === "PENDING_OPS" && (
                            <Link href={`/dashboard/admin/mentorship/disputes/${d.id}`}>
                              <Button size="sm" variant="outline">Resolve</Button>
                            </Link>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">No disputes yet.</p>
              )}
              {disputesData && <p className="text-sm text-muted-foreground mt-2">Total: {disputesData.total} dispute(s)</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-4 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Total released</CardTitle></CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">
                  ₹{revenueData?.totalReleasedPaise != null ? (revenueData.totalReleasedPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}
                </span>
                <p className="text-xs text-muted-foreground mt-1">{revenueData?.tranchesReleased ?? 0} tranches</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Platform fee</CardTitle></CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">
                  ₹{revenueData?.platformFeePaise != null ? (revenueData.platformFeePaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Mentor payouts</CardTitle></CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">
                  ₹{revenueData?.mentorPayoutPaise != null ? (revenueData.mentorPayoutPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Pilot waived</CardTitle></CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">
                  ₹{revenueData?.pilotWaivedPaise != null ? (revenueData.pilotWaivedPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}
                </span>
              </CardContent>
            </Card>
          </div>

          {revenueSnapshots && revenueSnapshots.length >= 2 && (
            <Card>
              <CardHeader><CardTitle>Revenue trend (30 days)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={revenueSnapshots.map((s) => ({ date: s.date, platform: s.platformFeePaise / 100, mentor: s.mentorPayoutPaise / 100 }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip formatter={(v: number) => [`₹${(v as number).toFixed(2)}`, ""]} />
                    <Line type="monotone" dataKey="platform" stroke="#f59e0b" name="Platform" strokeWidth={2} />
                    <Line type="monotone" dataKey="mentor" stroke="#22c55e" name="Mentor" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {revenueData?.byTier && Object.keys(revenueData.byTier).length > 0 && (
            <Card>
              <CardHeader><CardTitle>Revenue by tier</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tier</TableHead>
                      <TableHead>Released</TableHead>
                      <TableHead>Platform fee</TableHead>
                      <TableHead>Mentor payout</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(revenueData.byTier).map(([tier, data]) => (
                      <TableRow key={tier}>
                        <TableCell><Badge variant="outline">{tier}</Badge></TableCell>
                        <TableCell>₹{(data.released / 100).toFixed(2)}</TableCell>
                        <TableCell>₹{(data.platformFee / 100).toFixed(2)}</TableCell>
                        <TableCell>₹{(data.mentorPayout / 100).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Tier change log</CardTitle></CardHeader>
            <CardContent>
              {tierChangeLog?.items?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tranche</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tierChangeLog.items.map((log) => {
                      const ns = log.newState as { tierAtSigning?: string; tierAtRelease?: string } | undefined;
                      return (
                        <TableRow key={log.id}>
                          <TableCell>{log.entityId?.slice(0, 12)}…</TableCell>
                          <TableCell>
                            {ns?.tierAtSigning ?? "—"} → {ns?.tierAtRelease ?? "—"}
                          </TableCell>
                          <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">No tier changes recorded.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
