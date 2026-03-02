"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface JoinClientProps {
  refCode?: string;
  emailParam?: string;
}

export function JoinClient({ refCode, emailParam }: JoinClientProps) {
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!refCode) {
      setChecked(true);
      return;
    }
    const url = `/api/growth/referral/${encodeURIComponent(refCode)}${emailParam ? `?email=${encodeURIComponent(emailParam)}` : ""}`;
    fetch(url, { credentials: "include" })
      .then((r) => r.json())
      .then((d: { valid?: boolean; referrerName?: string }) => {
        setReferrerName(d.valid ? d.referrerName ?? null : null);
        setChecked(true);
      })
      .catch(() => {
        setChecked(true);
      });
  }, [refCode, emailParam]);

  return (
    <div className="max-w-md w-full text-center space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">
        {checked && referrerName
          ? `${referrerName} invited you to Ascend`
          : "Join Ascend"}
      </h1>
      <p className="text-text-secondary">
        {referrerName
          ? "Create your account to discover jobs, build your profile, and grow your career."
          : "Discover jobs, build your profile, and grow your career on Ascend."}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/auth/register">
          <Button className="w-full sm:w-auto btn-primary">
            Join Ascend
          </Button>
        </Link>
        <Link href="/auth/login">
          <Button variant="outline" className="w-full sm:w-auto">
            Already have an account? Sign in
          </Button>
        </Link>
      </div>
    </div>
  );
}
