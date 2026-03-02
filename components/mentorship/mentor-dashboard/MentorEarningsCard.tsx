"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function MentorEarningsCard() {
  const { data } = useSWR<{
    totalPaise: number;
    totalRupees: string;
    releasedCount: number;
    recentReleases: Array<{ amountPaise: number; releasedAt: string | null; trancheNumber: number }>;
  }>("/api/mentorship/earnings/me", fetcher);

  const total = data?.totalRupees ?? "0";
  const count = data?.releasedCount ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <IndianRupee className="h-4 w-4" />
          Earnings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">₹{total}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {count} tranche{count !== 1 ? "s" : ""} released
        </p>
      </CardContent>
    </Card>
  );
}
