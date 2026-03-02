"use client";

import useSWR from "swr";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type FlagRow = {
  id: string;
  key: string;
  enabled: boolean;
  description: string | null;
  updatedAt: string;
  updatedByName: string | null;
};

const DANGEROUS_KEYS = ["seeker_pilot_open"];

export function AdminFeatureFlagsClient() {
  const { data, mutate } = useSWR<{ flags: FlagRow[] }>(
    "/api/admin/feature-flags",
    fetcher
  );
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggle = async (key: string, enabled: boolean) => {
    setToggling(key);
    const res = await fetch(`/api/admin/feature-flags/${encodeURIComponent(key)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    if (res.ok) {
      mutate();
    } else {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? "Failed to update flag");
    }
    setToggling(null);
  };

  const flags = data?.flags ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Feature Flags</h1>

      <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-foreground">
          Changes take effect immediately. Use with care during the pilot.
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">Key</th>
              <th className="text-left p-3">Description</th>
              <th className="text-left p-3">State</th>
              <th className="text-left p-3">Last updated</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="p-3 font-mono text-xs">
                  {DANGEROUS_KEYS.includes(f.key) && (
                    <AlertTriangle className="inline h-4 w-4 text-amber-500 mr-1" />
                  )}
                  {f.key}
                </td>
                <td className="p-3 text-muted-foreground max-w-md">
                  {f.description ?? "—"}
                </td>
                <td className="p-3">
                  <Switch
                    checked={f.enabled}
                    disabled={toggling === f.key}
                    onCheckedChange={(checked) => handleToggle(f.key, checked)}
                  />
                </td>
                <td className="p-3 text-muted-foreground">
                  {formatDistanceToNow(new Date(f.updatedAt), {
                    addSuffix: true,
                  })}
                  {f.updatedByName && ` by ${f.updatedByName}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
