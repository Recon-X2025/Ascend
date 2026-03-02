"use client";

import { useEffect, useState } from "react";

interface MetricsData {
  users: {
    total: number;
    newLast7Days: number;
    newLast30Days: number;
  };
  outcomes: {
    totalEvents: number;
    byFeature: { feature: string; _count: { id: number } }[];
  };
  queues: { name: string; waiting: number; active: number; completed: number; failed: number }[];
}

export function AdminMetricsSection() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json) => {
        if (json.success && json.data) setData(json.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="mt-8">
        <h2 className="text-lg font-medium">Platform Metrics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="ascend-card p-4 skeleton h-24 rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="mt-8">
        <h2 className="text-lg font-medium">Platform Metrics</h2>
        <p className="mt-2 text-sm text-muted-foreground">Unable to load metrics. You may need platform admin access.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["Total users", "New (7d)", "New (30d)", "Outcome events"].map((label) => (
            <div key={label} className="ascend-card p-4">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-semibold">—</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const aiAdoptionRate =
    data.users.total > 0 && data.outcomes.byFeature.length > 0
      ? "—" // Could compute % users with at least one AI interaction
      : "0%";

  return (
    <section className="mt-8">
      <h2 className="text-lg font-medium">Platform Metrics</h2>
      <p className="text-sm text-muted-foreground mt-1">Acquisition metrics (populated as data flows in).</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="ascend-card p-4">
          <p className="text-sm text-muted-foreground">Total users</p>
          <p className="text-2xl font-semibold">{data.users.total}</p>
        </div>
        <div className="ascend-card p-4">
          <p className="text-sm text-muted-foreground">New registrations (7d)</p>
          <p className="text-2xl font-semibold">{data.users.newLast7Days}</p>
        </div>
        <div className="ascend-card p-4">
          <p className="text-sm text-muted-foreground">New registrations (30d)</p>
          <p className="text-2xl font-semibold">{data.users.newLast30Days}</p>
        </div>
        <div className="ascend-card p-4">
          <p className="text-sm text-muted-foreground">AI feature adoption</p>
          <p className="text-2xl font-semibold">{aiAdoptionRate}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="ascend-card p-4">
          <p className="text-sm text-muted-foreground">Resumes built (total)</p>
          <p className="text-2xl font-semibold">—</p>
        </div>
        <div className="ascend-card p-4">
          <p className="text-sm text-muted-foreground">Fit scores calculated</p>
          <p className="text-2xl font-semibold">—</p>
        </div>
        <div className="ascend-card p-4">
          <p className="text-sm text-muted-foreground">Optimiser sessions</p>
          <p className="text-2xl font-semibold">—</p>
        </div>
        <div className="ascend-card p-4">
          <p className="text-sm text-muted-foreground">Applications submitted</p>
          <p className="text-2xl font-semibold">—</p>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium text-muted-foreground">Queue health</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {data.queues.map((q) => (
            <div key={q.name} className="ascend-card p-3 text-sm">
              <p className="font-medium">{q.name}</p>
              <p className="text-muted-foreground">
                waiting: {q.waiting} · active: {q.active} · completed: {q.completed} · failed: {q.failed}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
