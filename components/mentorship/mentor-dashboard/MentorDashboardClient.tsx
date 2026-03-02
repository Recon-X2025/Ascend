"use client";

import { VerificationStatusWidget } from "./VerificationStatusWidget";
import { ProfileCompletenessWidget } from "./ProfileCompletenessWidget";
import { MentorProfileCard } from "./MentorProfileCard";
import { CapacityOverview } from "./CapacityOverview";
import { TierReputationCard } from "./TierReputationCard";
import { MentorEarningsCard } from "./MentorEarningsCard";
import { MentorFeeInfoCard } from "./MentorFeeInfoCard";
import { UpcomingSessionsPlaceholder } from "./UpcomingSessionsPlaceholder";
import { MentorApplicationInbox } from "../MentorApplicationInbox";
import { ContractsAwaitingSignatureWidget } from "./ContractsAwaitingSignatureWidget";
import type { MentorProfile, AvailabilityWindow } from "@prisma/client";

type Profile = MentorProfile & {
  availabilityWindows: AvailabilityWindow[];
  user?: { name: string | null };
};

interface MentorDashboardClientProps {
  verificationStatus: string;
  hasM2Profile: boolean;
  profile: Profile;
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
}

export function MentorDashboardClient({
  verificationStatus,
  hasM2Profile,
  profile,
  monetisationProgress,
}: MentorDashboardClientProps) {
  const isVerified = verificationStatus === "VERIFIED";

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0F1A0F] mb-6">Mentor dashboard</h1>

      <VerificationStatusWidget
        status={verificationStatus as "UNVERIFIED" | "PENDING" | "VERIFIED" | "REVERIFICATION_REQUIRED"}
      />

      {isVerified && !hasM2Profile && <ProfileCompletenessWidget />}

      {isVerified && hasM2Profile && (
        <>
          <ContractsAwaitingSignatureWidget />
          <MentorEarningsCard />
          <MentorFeeInfoCard />
          <TierReputationCard
            tier={profile.tier ?? "RISING"}
            tierUpdatedAt={profile.tierUpdatedAt}
            tierOverriddenByAdmin={profile.tierOverriddenByAdmin ?? false}
            verifiedOutcomeCount={profile.verifiedOutcomeCount ?? 0}
            disputeRate={profile.disputeRate}
            activeMenteeCount={profile.activeMenteeCount ?? 0}
            maxActiveMentees={profile.maxActiveMentees ?? 2}
            monetisationProgress={monetisationProgress ?? null}
          />
          <MentorProfileCard profile={profile} />
          <CapacityOverview
            maxActiveMentees={profile.maxActiveMentees ?? 2}
            currentMenteeCount={profile.activeMenteeCount ?? profile.currentMenteeCount ?? 0}
          />
          <div className="mt-8">
            <MentorApplicationInbox />
          </div>
        </>
      )}

      {isVerified && <UpcomingSessionsPlaceholder />}
    </div>
  );
}
