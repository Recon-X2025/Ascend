"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function ProviderEarningsTab() {
  const { data } = useSWR("/api/marketplace/providers/me/earnings", fetcher);

  if (!data) return <p className="text-muted-foreground">Loading...</p>;

  const currency = data.currency ?? "INR";
  const symbol = currency === "USD" ? "$" : "₹";

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Total earned</p>
        <p className="text-2xl font-bold">{symbol}{(data.totalEarned ?? 0) / (currency === "USD" ? 100 : 100)}</p>
      </div>
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Pending payout</p>
        <p className="text-2xl font-bold">{symbol}{(data.pendingPayout ?? 0) / (currency === "USD" ? 100 : 100)}</p>
      </div>
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Orders completed</p>
        <p className="text-2xl font-bold">{data.ordersCompleted ?? 0}</p>
      </div>
    </div>
  );
}
