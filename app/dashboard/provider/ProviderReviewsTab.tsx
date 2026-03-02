"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- prop kept for API; stub does not use it yet
export function ProviderReviewsTab(_props: { providerId: string }) {
  const { data } = useSWR("/api/marketplace/providers/me", fetcher);
  const provider = data?.provider;
  if (!provider) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <p className="text-muted-foreground">
      You have {provider.totalReviews ?? 0} reviews. A dedicated GET /api/marketplace/providers/me/reviews can list ProviderReview records for this provider.
    </p>
  );
}
