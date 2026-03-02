"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface BillingResumeCreditsTabProps {
  balance: number;
}

export function BillingResumeCreditsTab({ balance }: BillingResumeCreditsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resume optimisation credits</CardTitle>
        <p className="text-sm text-muted-foreground">
          Use credits to optimise your resume for specific job posts. One credit = one optimisation.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-2xl font-semibold">{balance} credit{balance !== 1 ? "s" : ""} available</p>
        <Button asChild>
          <Link href="/resume/optimise/purchase">Buy 1 credit — ₹99</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
