"use client";

import { useState } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type AuditEntry = {
  id: string;
  adminId: string;
  adminName: string | null;
  adminEmail: string | null;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

function buildUrl(params: {
  adminId: string;
  action: string;
  targetType: string;
  cursor: string;
}) {
  const u = new URLSearchParams();
  if (params.adminId) u.set("adminId", params.adminId);
  if (params.action) u.set("action", params.action);
  if (params.targetType) u.set("targetType", params.targetType);
  if (params.cursor) u.set("cursor", params.cursor);
  return `/api/admin/audit?${u.toString()}`;
}

function actionVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (
    action.includes("APPROVED") ||
    action.includes("UNBANNED") ||
    action.includes("UNSUSPENDED") ||
    action.includes("UNVERIFIED")
  )
    return "default";
  if (
    action.includes("BANNED") ||
    action.includes("REJECTED") ||
    action.includes("SUSPENDED")
  )
    return "destructive";
  if (action.includes("FLAG")) return "secondary";
  return "outline";
}

export function AdminAuditClient() {
  const [adminId, setAdminId] = useState("");
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [cursor, setCursor] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const url = buildUrl({ adminId, action, targetType, cursor });
  const { data } = useSWR<{
    entries: AuditEntry[];
    nextCursor: string | null;
    hasMore: boolean;
  }>(url, fetcher);

  const entries = data?.entries ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Log</h1>

      <div className="flex flex-wrap gap-4 items-center text-sm">
        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">Admin</span>
          <input
            type="text"
            placeholder="Admin ID"
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
            className="rounded-md border border-input bg-transparent px-3 py-1.5 w-40"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">Action</span>
          <input
            type="text"
            placeholder="e.g. USER_BANNED"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="rounded-md border border-input bg-transparent px-3 py-1.5 w-48"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">Target type</span>
          <input
            type="text"
            placeholder="e.g. User, Company"
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            className="rounded-md border border-input bg-transparent px-3 py-1.5 w-32"
          />
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAdminId("");
            setAction("");
            setTargetType("");
            setCursor("");
          }}
        >
          Clear filters
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">Time</th>
              <th className="text-left p-3">Admin</th>
              <th className="text-left p-3">Action</th>
              <th className="text-left p-3">Target</th>
              <th className="text-left p-3">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-3 text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true })}
                </td>
                <td className="p-3">
                  <span className="font-medium">{e.adminName ?? e.adminEmail ?? e.adminId}</span>
                </td>
                <td className="p-3">
                  <Badge variant={actionVariant(e.action)}>{e.action}</Badge>
                </td>
                <td className="p-3">
                  <span className="text-muted-foreground">{e.targetType}</span>
                  {e.targetLabel && (
                    <span className="ml-1">{e.targetLabel}</span>
                  )}
                </td>
                <td className="p-3">
                  {e.metadata && Object.keys(e.metadata).length > 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto py-1 text-xs"
                      onClick={() =>
                        setExpandedId(expandedId === e.id ? null : e.id)
                      }
                    >
                      {expandedId === e.id ? "Hide" : "Show"} JSON
                    </Button>
                  ) : (
                    "—"
                  )}
                  {expandedId === e.id && e.metadata && (
                    <pre className="mt-2 p-2 rounded bg-muted text-xs overflow-auto max-w-md">
                      {JSON.stringify(e.metadata, null, 2)}
                    </pre>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!entries.length && (
          <div className="p-8 text-center text-muted-foreground">
            No audit entries found.
          </div>
        )}
      </div>

      {data?.hasMore && (
        <Button
          variant="outline"
          onClick={() => data?.nextCursor && setCursor(data.nextCursor)}
        >
          Load more
        </Button>
      )}
    </div>
  );
}
