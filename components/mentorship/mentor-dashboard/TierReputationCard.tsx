"use client";

import Link from "next/link";
import { TIER_CONFIG, type MentorTierKey } from "@/lib/mentorship/tiers";
import { MONETISATION_UNLOCK_CRITERIA } from "@/lib/mentorship/monetisation";

type TierReputationCardProps = {
  tier: string;
  tierUpdatedAt: Date | string | null;
  tierOverriddenByAdmin: boolean;
  verifiedOutcomeCount: number;
  disputeRate: number | null;
  activeMenteeCount: number;
  maxActiveMentees: number;
  /** M-13: Monetisation unlock progress */
  monetisationProgress?: {
    isUnlocked: boolean;
    canChargeMentees: boolean;
    verifiedOutcomeCount: number;
    stenoRate: number | null;
    upheldDisputeCount: number;
    monthsOnPlatform?: number;
    reVerificationCurrent?: boolean;
    lockedReason?: string | null;
    reasons?: string[];
  } | null;
};

export function TierReputationCard({
  tier,
  tierUpdatedAt,
  tierOverriddenByAdmin,
  verifiedOutcomeCount,
  disputeRate,
  activeMenteeCount,
  maxActiveMentees,
  monetisationProgress,
}: TierReputationCardProps) {
  const config = TIER_CONFIG[tier as MentorTierKey] ?? TIER_CONFIG.RISING;
  const disputePct = (disputeRate ?? 0) * 100;
  const disputeColor =
    disputePct > 25 ? "text-red-600" : disputePct > 10 ? "text-amber-600" : "text-green-600";

  const outcomesToEstablished = tier === "RISING" ? Math.max(0, 5 - verifiedOutcomeCount) : null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="font-display font-semibold text-ink">Tier &amp; Reputation</h2>
        <Link
          href="/dashboard/mentor/tier-history"
          className="text-sm text-green hover:underline"
        >
          Tier history →
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span
          className={`text-sm font-medium px-2 py-1 rounded ${
            tier === "ELITE"
              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
              : tier === "ESTABLISHED"
                ? "bg-green/10 text-green"
                : "bg-[var(--border)] text-ink-3"
          }`}
        >
          {tier === "ELITE" ? "Elite Mentor ⭐" : tier === "ESTABLISHED" ? "Established Mentor" : "Rising Mentor"}
        </span>
        {tierUpdatedAt && (
          <span className="text-xs text-ink-4">
            Updated {new Date(tierUpdatedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {tierOverriddenByAdmin && (
        <p className="text-sm text-ink-4 mb-3">Your tier has been manually set by Ascend.</p>
      )}

      <ul className="space-y-1 text-sm text-ink-3">
        <li>
          Verified outcomes: <strong className="text-ink">{verifiedOutcomeCount}</strong>
        </li>
        <li>
          Dispute rate: <span className={disputeColor}>{disputePct.toFixed(0)}%</span>
        </li>
        <li>
          Active mentees: <strong className="text-ink">{activeMenteeCount}</strong> of{" "}
          <strong className="text-ink">{maxActiveMentees}</strong> slots filled
        </li>
        <li>
          Platform fee: <strong className="text-ink">{config.platformFeePercent}%</strong>
        </li>
      </ul>

      {outcomesToEstablished != null && outcomesToEstablished > 0 && outcomesToEstablished <= 2 && (
        <p className="mt-3 text-sm text-green">
          {outcomesToEstablished} more verified outcome{outcomesToEstablished !== 1 ? "s" : ""} to
          reach Established tier.
        </p>
      )}

      {monetisationProgress && (
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <h3 className="text-sm font-medium text-ink mb-2">Monetisation unlock</h3>
          {monetisationProgress.isUnlocked && monetisationProgress.canChargeMentees ? (
            <p className="text-sm text-green">You can charge mentees. Set your session fee in Pricing.</p>
          ) : monetisationProgress.isUnlocked ? (
            <p className="text-sm text-ink-3">
              You meet the criteria. Subscribe to Mentor Marketplace to start charging.
            </p>
          ) : (
            <div className="text-sm text-ink-3 space-y-1">
              <p>Progress to unlock paid engagements:</p>
              <ul className="list-disc list-inside">
                <li>
                  Verified outcomes: {monetisationProgress.verifiedOutcomeCount} / {MONETISATION_UNLOCK_CRITERIA.minVerifiedOutcomes}
                </li>
                {monetisationProgress.stenoRate != null && (
                  <li>Steno rate: {Math.round(monetisationProgress.stenoRate * 100)}% (min {MONETISATION_UNLOCK_CRITERIA.minStenoRate * 100}%)</li>
                )}
                <li>Upheld disputes: {monetisationProgress.upheldDisputeCount} (max {MONETISATION_UNLOCK_CRITERIA.maxUpheldDisputes})</li>
                {monetisationProgress.monthsOnPlatform != null && (
                  <li>Months on platform: {monetisationProgress.monthsOnPlatform} / {MONETISATION_UNLOCK_CRITERIA.minMonthsOnPlatform}</li>
                )}
              </ul>
              {monetisationProgress.reasons && monetisationProgress.reasons.length > 0 && (
                <p className="text-xs mt-1 text-ink-4">{monetisationProgress.reasons[0]}</p>
              )}
            </div>
          )}
          <Link href="/dashboard/mentor/pricing" className="text-sm text-green hover:underline mt-2 inline-block">
            Pricing &amp; SEO boost →
          </Link>
        </div>
      )}
    </div>
  );
}
