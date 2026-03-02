"use client";

import { useState } from "react";
import useSWR from "swr";
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
import { FileText, Shield, Flag, Database, BarChart3 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function buildParams(o: Record<string, string | number | undefined>) {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => {
    if (v !== undefined && v !== "") p.set(k, String(v));
  });
  return p.toString();
}

export function TrustSafetyClient() {
  const [auditPage, setAuditPage] = useState(1);
  const [auditCategory, setAuditCategory] = useState("");
  const [auditSeverity, setAuditSeverity] = useState("");
  const [securityPage, setSecurityPage] = useState(1);
  const [reportsPage, setReportsPage] = useState(1);
  const [dataRequestsPage, setDataRequestsPage] = useState(1);

  const auditQ = buildParams({
    page: auditPage,
    limit: 50,
    category: auditCategory || undefined,
    severity: auditSeverity || undefined,
  });
  const { data: auditData } = useSWR(
    `/api/admin/audit-log?${auditQ}`,
    fetcher,
    { refreshInterval: 30000 }
  );
  const { data: securityData } = useSWR(
    `/api/admin/security-events?page=${securityPage}&limit=20`,
    fetcher,
    { refreshInterval: 30000 }
  );
  const { data: reportsData } = useSWR(
    `/api/admin/reports?page=${reportsPage}&limit=20`,
    fetcher,
    { refreshInterval: 30000 }
  );
  const { data: dataRequestsData } = useSWR(
    `/api/admin/data-requests?page=${dataRequestsPage}&limit=20`,
    fetcher,
    { refreshInterval: 30000 }
  );
  const { data: summary } = useSWR("/api/admin/compliance-summary", fetcher, {
    refreshInterval: 60000,
  });

  const auditEntries = auditData?.data ?? [];
  const securityEvents = securityData?.data ?? [];
  const reports = reportsData?.reports ?? [];
  const dataRequests = dataRequestsData?.data ?? [];

  const handleBlockIp = async (ip: string) => {
    await fetch("/api/admin/security-events/block-ip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip }),
    });
    window.location.reload();
  };

  const handleResolveReport = async (id: string, status: string, resolution?: string) => {
    await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, resolution: resolution || "" }),
    });
    window.location.reload();
  };

  const handleUpdateDataRequest = async (id: string, status: string) => {
    await fetch(`/api/admin/data-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Trust & Safety</h1>
      <Tabs defaultValue="audit">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Audit Log
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="h-4 w-4" /> Reports
          </TabsTrigger>
          <TabsTrigger value="data-requests" className="flex items-center gap-2">
            <Database className="h-4 w-4" /> Data Requests
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Audit Log</CardTitle>
              <div className="flex gap-2">
                <select
                  value={auditCategory}
                  onChange={(e) => setAuditCategory(e.target.value)}
                  className="rounded border px-2 py-1 text-sm"
                >
                  <option value="">All categories</option>
                  <option value="AUTH">AUTH</option>
                  <option value="DATA_ACCESS">DATA_ACCESS</option>
                  <option value="DATA_MUTATION">DATA_MUTATION</option>
                  <option value="ADMIN_ACTION">ADMIN_ACTION</option>
                  <option value="COMPLIANCE">COMPLIANCE</option>
                  <option value="MENTORSHIP">MENTORSHIP</option>
                  <option value="SECURITY">SECURITY</option>
                </select>
                <select
                  value={auditSeverity}
                  onChange={(e) => setAuditSeverity(e.target.value)}
                  className="rounded border px-2 py-1 text-sm"
                >
                  <option value="">All severities</option>
                  <option value="INFO">INFO</option>
                  <option value="WARNING">WARNING</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/api/admin/audit-log/export?${auditQ}`} download>
                    Export CSV
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Success</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditEntries.map((e: Record<string, unknown>) => (
                    <TableRow key={String(e.id)}>
                      <TableCell className="text-xs">
                        {new Date(String(e.timestamp)).toLocaleString()}
                      </TableCell>
                      <TableCell>{String(e.actorName ?? e.actorId ?? "—")}</TableCell>
                      <TableCell>{String(e.action)}</TableCell>
                      <TableCell>{String(e.category)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            e.severity === "CRITICAL"
                              ? "destructive"
                              : e.severity === "WARNING"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {String(e.severity)}
                        </Badge>
                      </TableCell>
                      <TableCell>{e.success ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-xs">{String(e.actorIp ?? "—")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={auditPage <= 1}
                  onClick={() => setAuditPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={auditEntries.length < 50}
                  onClick={() => setAuditPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityEvents.map((e: Record<string, unknown>) => (
                    <TableRow key={String(e.id)}>
                      <TableCell className="text-xs">
                        {new Date(String(e.timestamp)).toLocaleString()}
                      </TableCell>
                      <TableCell>{String(e.type)}</TableCell>
                      <TableCell>{String(e.actorIp ?? "—")}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{String(e.endpoint)}</TableCell>
                      <TableCell>
                        {e.actorIp ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleBlockIp(String(e.actorIp))}
                          >
                            Block IP
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={securityPage <= 1}
                  onClick={() => setSecurityPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(securityData?.data?.length ?? 0) < 20}
                  onClick={() => setSecurityPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
          {summary?.blockedIps?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Blocked IPs ({summary.blockedIpsCount})</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-wrap gap-2">
                  {summary.blockedIps.map((ip: string) => (
                    <li key={ip} className="flex items-center gap-2 rounded bg-muted px-2 py-1">
                      {ip}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await fetch("/api/admin/security-events/unblock-ip", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ip }),
                          });
                          window.location.reload();
                        }}
                      >
                        Unblock
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r: Record<string, unknown>) => (
                    <TableRow key={String(r.id)}>
                      <TableCell className="text-xs">
                        {new Date(String(r.createdAt)).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {String(r.targetType)} / {String(r.targetId)}
                      </TableCell>
                      <TableCell>{String(r.reason)}</TableCell>
                      <TableCell>{String(r.status)}</TableCell>
                      <TableCell>
                        {r.status === "PENDING" && (
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolveReport(String(r.id), "RESOLVED_NO_ACTION")}
                            >
                              No Action
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() =>
                                handleResolveReport(String(r.id), "RESOLVED_ACTION_TAKEN", "Removed")
                              }
                            >
                              Remove
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResolveReport(String(r.id), "DISMISSED")}
                            >
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-2 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reportsPage <= 1}
                  onClick={() => setReportsPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {reportsPage}
                  {reportsData?.totalPages != null ? ` of ${reportsData.totalPages}` : ""}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    reportsData?.totalPages == null || reportsPage >= reportsData.totalPages
                  }
                  onClick={() => setReportsPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requested</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataRequests.map((r: Record<string, unknown>) => {
                    const requested = new Date(String(r.requestedAt));
                    const hours = (Date.now() - requested.getTime()) / (1000 * 60 * 60);
                    const overdue = r.status === "PENDING" && hours > 48;
                    return (
                      <TableRow key={String(r.id)}>
                        <TableCell className="text-xs">{requested.toLocaleString()}</TableCell>
                        <TableCell>
                          {String(
                            (r.user as { email?: string } | undefined)?.email ?? r.userId ?? "—"
                          )}
                        </TableCell>
                        <TableCell>{String(r.type)}</TableCell>
                        <TableCell>{String(r.status)}</TableCell>
                        <TableCell>
                          {overdue ? (
                            <Badge variant="destructive">Overdue</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {r.status === "PENDING" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateDataRequest(String(r.id), "PROCESSING")}
                            >
                              Mark Processing
                            </Button>
                          )}
                          {r.status === "PROCESSING" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mr-1"
                                onClick={() => handleUpdateDataRequest(String(r.id), "COMPLETED")}
                              >
                                Complete
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleUpdateDataRequest(String(r.id), "FAILED")}
                              >
                                Fail
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-2 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={dataRequestsPage <= 1}
                  onClick={() => setDataRequestsPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {dataRequestsPage}
                  {dataRequestsData?.totalPages != null
                    ? ` of ${dataRequestsData.totalPages}`
                    : ""}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    dataRequestsData?.totalPages == null ||
                    dataRequestsPage >= dataRequestsData.totalPages
                  }
                  onClick={() => setDataRequestsPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Audit (30d)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{summary?.totalAuditLast30Days ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">CRITICAL (30d)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">
                  {summary?.criticalAuditLast30Days ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Open reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{summary?.openReports ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Pending data requests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{summary?.pendingDataRequests ?? 0}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Data retention</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{summary?.dataRetention?.contracts ?? "Contracts: 7yr"}</p>
              <p className="text-sm">{summary?.dataRetention?.transcripts ?? "Transcripts: 3yr"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent CRITICAL audit events</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(summary?.recentCriticalAudit ?? []).map((e: Record<string, unknown>) => (
                    <TableRow key={String(e.id)}>
                      <TableCell className="text-xs">
                        {new Date(String(e.timestamp)).toLocaleString()}
                      </TableCell>
                      <TableCell>{String(e.action)}</TableCell>
                      <TableCell>
                        {String(e.targetType)} / {String(e.targetId)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
