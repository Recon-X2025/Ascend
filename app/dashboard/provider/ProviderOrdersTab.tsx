"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- prop kept for API; stub does not use it yet
export function ProviderOrdersTab(_props: { providerId: string }) {
  const { data } = useSWR("/api/marketplace/providers/me", fetcher);
  const provider = data?.provider;
  if (!provider) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <p className="text-muted-foreground">
      Orders (resume review, mock interview, coaching) are listed in your provider account. Use GET /api/marketplace/resume-review/orders and filter by providerId on the backend, or add a dedicated GET /api/marketplace/providers/me/orders that returns all order types for this provider.
    </p>
  );
}
