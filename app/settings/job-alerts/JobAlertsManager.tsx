"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Alert = {
  id: string;
  name: string;
  query: string;
  frequency: string;
  active: boolean;
  lastSentAt: Date | null;
  createdAt: Date;
};

export function JobAlertsManager({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);

  const toggleActive = async (id: string, active: boolean) => {
    const res = await fetch("/api/alerts/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    if (res.ok) setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, active } : a)));
  };

  const setFrequency = async (id: string, frequency: string) => {
    const res = await fetch("/api/alerts/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frequency }),
    });
    if (res.ok) setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, frequency } : a)));
  };

  const deleteAlert = async (id: string) => {
    const res = await fetch("/api/alerts/" + id, { method: "DELETE" });
    if (res.ok) setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const sendTest = async (id: string) => {
    await fetch("/api/alerts/" + id + "/test", { method: "POST" });
  };

  if (alerts.length === 0) {
    return (
      <p className="text-muted-foreground">
        No alerts yet. Save a search on the <Link href="/jobs" className="text-primary hover:underline">jobs page</Link> and create an alert from{" "}
        <Link href="/jobs/saved-searches" className="text-primary hover:underline">saved searches</Link>.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {alerts.map((alert) => (
        <li key={alert.id} className="border border-border rounded-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium">{alert.name}</p>
              <p className="text-sm text-muted-foreground">{alert.query || "—"}</p>
              {alert.lastSentAt && (
                <p className="text-xs text-muted-foreground mt-1">Last sent: {new Date(alert.lastSentAt).toLocaleDateString()}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={alert.active}
                  onChange={(e) => toggleActive(alert.id, e.target.checked)}
                />
                Active
              </label>
              <select
                value={alert.frequency}
                onChange={(e) => setFrequency(alert.id, e.target.value)}
                className="rounded border border-input bg-background px-2 py-1 text-sm"
              >
                <option value="IMMEDIATE">Immediate</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
              </select>
              <Button variant="outline" size="sm" onClick={() => sendTest(alert.id)}>
                Test
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deleteAlert(alert.id)}>
                Delete
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
