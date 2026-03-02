"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function TrendSpan({ delta }: { delta?: number | null }) {
  if (delta == null || delta === 0) return null;
  const isUp = delta > 0;
  return (
    <span className={`text-xs flex items-center gap-0.5 ${isUp ? "text-green-600" : "text-red-600"}`}>
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isUp ? "+" : ""}{(delta * 100).toFixed(1)}%
    </span>
  );
}

export function MentorAnalyticsClient() {
  const [filter, setFilter] = useState<"active" | "completed" | "all">("all");

  const { data: meData } = useSWR<{
    snapshot: Record<string, unknown> | null;
    trend30d: Record<string, number> | null;
  }>("/api/mentorship/analytics/me", fetcher);
  const { data: tierProgress } = useSWR<{
    currentTier: string;
    nextTier: string | null;
    verifiedOutcomes: number;
    requiredForNext: number;
    remaining: number;
    progressPercent: number;
    blockers: string[];
  }>("/api/mentorship/analytics/me/tier-progress", fetcher);
  const { data: snapshots } = useSWR<Array<Record<string, unknown>>>(
    "/api/mentorship/analytics/me/snapshots?days=90",
    fetcher
  );
  const { data: payoutSummary } = useSWR<{
    totalEarnedRupees: string;
    pendingEarnedRupees: string;
    inEscrowRupees: string;
  }>("/api/mentorship/mentor/payout-summary", fetcher);
  const { data: engagements } = useSWR<Array<{
    id: string;
    menteeFirstName: string;
    type: string;
    startDate: string | null;
    status: string;
    sessionsCount: number;
    milestonesTotal: number;
    milestonesComplete: number;
    outcomeStatus: string | null;
  }>>(`/api/mentorship/analytics/me/engagements?filter=${filter}`, fetcher);

  const snapshot = meData?.snapshot;
  const trend30d = meData?.trend30d;
  const hasEnoughForCharts = (snapshots?.length ?? 0) >= 4;

  const rateColor = (rate: number | null | undefined | unknown, invert = false) => {
    const n = typeof rate === "number" ? rate : null;
    if (n == null) return "text-muted-foreground";
    const pct = n * 100;
    if (invert) return pct > 25 ? "text-red-600 font-medium" : pct >= 10 ? "text-amber-600" : "text-green-600";
    return pct >= 80 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-600";
  };

  const sessionsPerWeek = (() => {
    if (!snapshots || snapshots.length < 4) return [];
    const sorted = [...snapshots].sort(
      (a, b) => (a.snapshotDate as string).localeCompare(b.snapshotDate as string)
    );
    const out: { week: string; sessions: number }[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const prevWeek = (prev.snapshotDate as string)?.slice(0, 7) ?? "";
      const currWeek = (curr.snapshotDate as string)?.slice(0, 7) ?? "";
      if (prevWeek !== currWeek) {
        const delta = ((curr.sessionsCompleted as number) ?? 0) - ((prev.sessionsCompleted as number) ?? 0);
        out.push({ week: currWeek, sessions: Math.max(0, delta) });
      }
    }
    return out.slice(-12);
  })();

  const outcomeRateTrend = hasEnoughForCharts && snapshots
    ? snapshots.map((s) => ({
        date: (s.snapshotDate as string)?.slice(0, 7) ?? "",
        rate: ((s.outcomeRate as number) ?? 0) * 100,
      }))
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0F1A0F]">Analytics</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Acceptance rate</CardTitle></CardHeader>
          <CardContent>
            <span className={`text-2xl font-bold ${rateColor(snapshot?.acceptanceRate)}`}>
              {snapshot?.acceptanceRate != null ? `${((snapshot.acceptanceRate as number) * 100).toFixed(0)}%` : "—"}
            </span>
            <div className="mt-1"><TrendSpan delta={(() => { const v = trend30d?.acceptanceRate; return typeof v === "number" ? v : undefined; })() as number | undefined} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Completion rate</CardTitle></CardHeader>
          <CardContent>
            <span className={`text-2xl font-bold ${rateColor(snapshot?.completionRate)}`}>
              {snapshot?.completionRate != null ? `${((snapshot.completionRate as number) * 100).toFixed(0)}%` : "—"}
            </span>
            <div className="mt-1"><TrendSpan delta={(() => { const v = trend30d?.completionRate; return typeof v === "number" ? v : undefined; })() as number | undefined} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Outcome rate</CardTitle></CardHeader>
          <CardContent>
            <span className={`text-2xl font-bold ${rateColor(snapshot?.outcomeRate)}`}>
              {snapshot?.outcomeRate != null ? `${((snapshot.outcomeRate as number) * 100).toFixed(0)}%` : "—"}
            </span>
            <div className="mt-1"><TrendSpan delta={(() => { const v = trend30d?.outcomeRate; return typeof v === "number" ? v : undefined; })() as number | undefined} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Dispute rate</CardTitle></CardHeader>
          <CardContent>
            <span className={`text-2xl font-bold ${rateColor(snapshot?.disputeRate, true)}`}>
              {snapshot?.disputeRate != null ? `${((snapshot.disputeRate as number) * 100).toFixed(0)}%` : "—"}
            </span>
            <div className="mt-1"><TrendSpan delta={(() => { const v = trend30d?.disputeRate; return typeof v === "number" ? -v : undefined; })() as number | undefined} /></div>
          </CardContent>
        </Card>
      </div>

      {tierProgress && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Tier progress</CardTitle>
            <Link href="/dashboard/mentor/tier-history" className="text-sm text-green hover:underline">
              Tier history →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{tierProgress.currentTier}</Badge>
              {tierProgress.nextTier ? (
                <span className="text-sm text-muted-foreground">
                  {tierProgress.remaining} more verified outcomes to reach {tierProgress.nextTier}
                </span>
              ) : (
                <span className="text-sm text-green-600">At top tier</span>
              )}
            </div>
            <Progress value={tierProgress.progressPercent} className="h-2" />
            {tierProgress.blockers.length > 0 && (
              <ul className="text-sm text-amber-600">
                {tierProgress.blockers.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Engagements</CardTitle>
          <div className="flex gap-2">
            {(["all", "active", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-2 py-1 rounded ${filter === f ? "bg-[#0F1A0F] text-white" : "bg-[#0F1A0F]/10"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mentee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Milestones</TableHead>
                <TableHead>Outcome</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(engagements ?? []).map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.menteeFirstName}</TableCell>
                  <TableCell>{e.type}</TableCell>
                  <TableCell>{e.startDate?.slice(0, 10) ?? "—"}</TableCell>
                  <TableCell>{e.status}</TableCell>
                  <TableCell>{e.sessionsCount}</TableCell>
                  <TableCell>{e.milestonesComplete}/{e.milestonesTotal}</TableCell>
                  <TableCell>{e.outcomeStatus ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(engagements?.length ?? 0) === 0 && (
            <p className="text-muted-foreground text-sm py-4">No engagements.</p>
          )}
        </CardContent>
      </Card>

      {hasEnoughForCharts && sessionsPerWeek.length >= 4 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Sessions per week (last 12 weeks)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sessionsPerWeek}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="sessions" fill="#22c55e" name="Sessions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {hasEnoughForCharts && outcomeRateTrend.length >= 4 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Outcome rate (monthly)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={outcomeRateTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [`${v.toFixed(0)}%`, "Outcome rate"]} />
                <Line type="monotone" dataKey="rate" stroke="#8b5cf6" name="Outcome rate" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Earnings</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Released</span>
            <span className="font-bold">₹{payoutSummary?.totalEarnedRupees ?? "0.00"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pending release</span>
            <span className="font-medium">₹{payoutSummary?.pendingEarnedRupees ?? "0.00"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">In escrow</span>
            <span className="font-medium">₹{payoutSummary?.inEscrowRupees ?? "0.00"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
