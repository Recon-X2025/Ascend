"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function InvestorDashboardClient() {
  const [alertMetric, setAlertMetric] = useState("");
  const [alertThreshold, setAlertThreshold] = useState("");
  const [alertDirection, setAlertDirection] = useState<"ABOVE" | "BELOW">("BELOW");
  const [alertMessage, setAlertMessage] = useState("");

  const { data: snapshotData } = useSWR<{
    current: Record<string, unknown> | null;
    vsLastWeek: Record<string, string> | null;
    vsLastMonth: Record<string, string> | null;
  }>("/api/admin/investor/snapshot", fetcher);
  const { data: snapshots } = useSWR<Record<string, unknown>[]>(
    "/api/admin/investor/snapshots?days=30",
    fetcher
  );
  const { data: retention } = useSWR<{ cohorts: { weekLabel: string; registered: number; w1: number; w2: number; w4: number; w8: number; w12: number }[] }>(
    "/api/admin/investor/retention",
    fetcher
  );
  const { data: revenue } = useSWR<{ month: string; newMrr: number; expansionMrr: number; churnedMrr: number; netNewMrr: number }[]>(
    "/api/admin/investor/revenue",
    fetcher
  );
  const { data: northStar } = useSWR<{ value: number; trend: string; label: string }>(
    "/api/admin/investor/north-star",
    fetcher
  );
  const { data: alerts, mutate: mutateAlerts } = useSWR<Array<{ id: string; metric?: string; direction?: string; threshold?: string; message?: string; triggeredAt?: string; resolvedAt?: string; isActive?: boolean }>>(
    "/api/admin/investor/alerts",
    fetcher
  );

  const viewedTracked = useRef(false);
  useEffect(() => {
    if (viewedTracked.current) return;
    viewedTracked.current = true;
    if (Math.random() > 0.5) return; // sampled: ~50% of views
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "PHASE20_INVESTOR_DASHBOARD_VIEWED",
        metadata: { source: "investor_dashboard" },
      }),
    }).catch(() => {});
  }, []);

  const current = snapshotData?.current as Record<string, number> | undefined;
  const vsLastWeek = snapshotData?.vsLastWeek as Record<string, string> | undefined;

  const exportCsv = () => {
    if (!current) return;
    const rows = Object.entries(current).map(([k, v]) => `${k},${v}`);
    const blob = new Blob([["metric,value", ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `investor-snapshot-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleAddAlert = async () => {
    if (!alertMetric || !alertThreshold || !alertMessage) return;
    const res = await fetch("/api/admin/investor/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metric: alertMetric,
        threshold: parseFloat(alertThreshold),
        direction: alertDirection,
        message: alertMessage,
      }),
    });
    if (res.ok) {
      mutateAlerts();
      setAlertMetric("");
      setAlertThreshold("");
      setAlertMessage("");
    }
  };

  const toggleAlert = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/investor/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    mutateAlerts();
  };

  const pctColor = (s: string) => {
    if (!s) return "";
    if (s.startsWith("+") && s !== "+0%") return "text-green-600";
    if (s.startsWith("-")) return "text-red-600";
    return "text-ink-3";
  };

  const retentionColor = (pct: number) => {
    if (pct >= 0.6) return "bg-green-500";
    if (pct >= 0.3) return "bg-amber-500";
    return "bg-red-500";
  };

  const keyMetrics = current
    ? [
        { label: "DAU/MAU", value: (current.dauMauRatio ?? 0).toFixed(2), vs: vsLastWeek?.dauMauRatio },
        { label: "MRR (INR)", value: `₹${Math.round(current.mrrInr ?? 0).toLocaleString()}`, vs: vsLastWeek?.mrrInr },
        { label: "Paying Users", value: String(current.payingUsers ?? 0), vs: vsLastWeek?.payingUsers },
        { label: "Churn Rate", value: `${((current.churnRate ?? 0) * 100).toFixed(1)}%`, vs: vsLastWeek?.churnRate },
        { label: "Viral Coefficient", value: (current.viralCoefficient ?? 0).toFixed(1), vs: vsLastWeek?.viralCoefficient },
        { label: "Verified Outcomes", value: String(current.verifiedOutcomes ?? 0), vs: vsLastWeek?.verifiedOutcomes },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Platform Intelligence</h1>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={!current}>
          Export Snapshot (CSV)
        </Button>
      </div>

      {northStar && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">North Star</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{northStar.value}</div>
            <p className="text-muted-foreground text-sm mt-1">{northStar.label}</p>
            <p className="text-sm mt-1">{northStar.trend}</p>
            <p className="text-xs text-muted-foreground mt-2">Your core value metric</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {keyMetrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">{m.label}</p>
              <p className="text-xl font-semibold mt-1">{m.value}</p>
              {m.vs != null && (
                <span className={`text-xs ${pctColor(m.vs)}`}>{m.vs}</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {snapshots && snapshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>User growth (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={snapshots}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="snapshotDate" tickFormatter={(v) => v?.slice(0, 10)} />
                <YAxis />
                <Tooltip labelFormatter={(v) => v?.slice(0, 10)} />
                <Legend />
                <Line type="monotone" dataKey="dau" stroke="#16A34A" name="DAU" />
                <Line type="monotone" dataKey="wau" stroke="#2563EB" name="WAU" />
                <Line type="monotone" dataKey="mau" stroke="#9333EA" name="MAU" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {snapshots && snapshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>MRR trend (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={snapshots}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="snapshotDate" tickFormatter={(v) => v?.slice(0, 10)} />
                <YAxis />
                <Tooltip labelFormatter={(v) => v?.slice(0, 10)} />
                <Area type="monotone" dataKey="mrrInr" stroke="#16A34A" fill="#16A34A" fillOpacity={0.3} name="MRR (INR)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {revenue && revenue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue waterfall (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenue} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="newMrr" fill="#16A34A" name="New MRR" />
                <Bar dataKey="expansionMrr" fill="#2563EB" name="Expansion MRR" />
                <Bar dataKey="churnedMrr" fill="#DC2626" name="Churned MRR" />
                <Bar dataKey="netNewMrr" fill="#9333EA" name="Net New MRR" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {snapshots && snapshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI usage (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={snapshots}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="snapshotDate" tickFormatter={(v) => v?.slice(0, 10)} />
                <YAxis />
                <Tooltip labelFormatter={(v) => v?.slice(0, 10)} />
                <Bar dataKey="aiInteractionsToday" fill="#0EA5E9" name="AI interactions (day)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {retention?.cohorts && retention.cohorts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Retention cohorts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2">Cohort</th>
                    <th className="text-left p-2">Registered</th>
                    <th className="text-left p-2">W1</th>
                    <th className="text-left p-2">W2</th>
                    <th className="text-left p-2">W4</th>
                    <th className="text-left p-2">W8</th>
                    <th className="text-left p-2">W12</th>
                  </tr>
                </thead>
                <tbody>
                  {retention.cohorts.map((c) => (
                    <tr key={c.weekLabel}>
                      <td className="p-2">{c.weekLabel}</td>
                      <td className="p-2">{c.registered}</td>
                      <td className="p-2">
                        <span className={`inline-block w-12 px-2 py-1 rounded text-white text-center ${retentionColor(c.w1)}`}>
                          {(c.w1 * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`inline-block w-12 px-2 py-1 rounded text-white text-center ${retentionColor(c.w2)}`}>
                          {(c.w2 * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`inline-block w-12 px-2 py-1 rounded text-white text-center ${retentionColor(c.w4)}`}>
                          {(c.w4 * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`inline-block w-12 px-2 py-1 rounded text-white text-center ${retentionColor(c.w8)}`}>
                          {(c.w8 * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`inline-block w-12 px-2 py-1 rounded text-white text-center ${retentionColor(c.w12)}`}>
                          {(c.w12 * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Metric alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <Label>Metric</Label>
              <Input
                value={alertMetric}
                onChange={(e) => setAlertMetric(e.target.value)}
                placeholder="e.g. dauMauRatio"
                className="w-36"
              />
            </div>
            <div>
              <Label>Threshold</Label>
              <Input
                type="number"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                placeholder="0.15"
                className="w-24"
              />
            </div>
            <div>
              <Label>Direction</Label>
              <Select value={alertDirection} onValueChange={(v) => setAlertDirection(v as "ABOVE" | "BELOW")}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ABOVE">Above</SelectItem>
                  <SelectItem value="BELOW">Below</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label>Message</Label>
              <Input
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="Alert message"
              />
            </div>
            <Button onClick={handleAddAlert}>Add alert</Button>
          </div>
          <ul className="space-y-2">
            {(alerts ?? []).map((a) => (
              <li key={a.id} className="flex items-center gap-4 text-sm">
                <span>{a.metric} {a.direction} {a.threshold}</span>
                <span className="text-muted-foreground">{a.message?.slice(0, 50)}</span>
                <span className={a.triggeredAt ? "text-amber-600" : ""}>
                  {a.triggeredAt ? "Triggered" : a.resolvedAt ? "Resolved" : "Active"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleAlert(a.id, a.isActive ?? false)}
                >
                  {a.isActive ? "Disable" : "Enable"}
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
