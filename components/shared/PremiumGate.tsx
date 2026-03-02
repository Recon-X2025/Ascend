"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PremiumGateProps {
  /** Feature key for analytics; not used in render */
  feature?: string;
  children: React.ReactNode;
  /** When true, show content; when false, show blurred overlay + CTA */
  allowed: boolean;
  className?: string;
}

/**
 * Phase 8: Blur + lock overlay for premium-gated content.
 * Never hide — show content exists but blurred with upgrade CTA.
 */
export function PremiumGate({ children, allowed, className }: PremiumGateProps) {
  if (allowed) {
    return <div className={className}>{children}</div>;
  }
  return (
    <div className={cn("relative", className)}>
      <div className="blur-[4px] select-none pointer-events-none [&_*]:select-none">
        {children}
      </div>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/70 dark:bg-ink/10 rounded-xl"
        aria-hidden="true"
      >
        <Lock className="h-8 w-8 text-ink-3" />
        <p className="text-sm font-medium text-ink-2 text-center px-4">
          Unlock full salary intelligence
        </p>
        <Link href="/dashboard/billing/upgrade">
          <Button variant="primary" size="sm">
            Upgrade to Premium
          </Button>
        </Link>
      </div>
    </div>
  );
}
