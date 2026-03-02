"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type Status = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REVERIFICATION_REQUIRED";

interface VerificationStatusWidgetProps {
  status: Status;
}

export function VerificationStatusWidget({ status }: VerificationStatusWidgetProps) {
  if (status === "VERIFIED") return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 mb-6">
      {status === "UNVERIFIED" && (
        <>
          <p className="font-medium text-amber-800 dark:text-amber-200">
            You haven&apos;t submitted verification yet.
          </p>
          <Link href="/mentorship/verify" className="inline-block mt-2">
            <Button size="sm">Verify identity</Button>
          </Link>
        </>
      )}
      {status === "PENDING" && (
        <p className="font-medium text-amber-800 dark:text-amber-200">
          Your identity verification is under review. SLA: 48 hours.
        </p>
      )}
      {status === "REVERIFICATION_REQUIRED" && (
        <>
          <p className="font-medium text-amber-800 dark:text-amber-200">
            Your verification has expired. Please re-verify.
          </p>
          <Link href="/mentorship/verify" className="inline-block mt-2">
            <Button size="sm">Re-verify</Button>
          </Link>
        </>
      )}
    </div>
  );
}
