"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Percent } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function MentorFeeInfoCard() {
  const { data } = useSWR<{
    totalEarnedRupees: string;
    pendingEarnedRupees: string;
    inEscrowRupees: string;
  }>("/api/mentorship/mentor/payout-summary", fetcher);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Percent className="h-4 w-4" />
          Fee & Payout
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Released to you</span>
          <span className="font-medium">₹{data?.totalEarnedRupees ?? "0.00"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Pending release</span>
          <span className="font-medium">₹{data?.pendingEarnedRupees ?? "0.00"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">In escrow</span>
          <span className="font-medium">₹{data?.inEscrowRupees ?? "0.00"}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Platform fee is based on your tier at release. Payout = gross minus fee.
        </p>
      </CardContent>
    </Card>
  );
}
