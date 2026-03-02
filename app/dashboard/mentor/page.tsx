import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { checkMonetisationEligibility } from "@/lib/mentorship/monetisation";
import { MentorDashboardClient } from "@/components/mentorship/mentor-dashboard/MentorDashboardClient";

export default async function MentorDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/dashboard/mentor");
  }

  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      verification: { select: { status: true } },
      availabilityWindows: true,
      monetisationStatus: true,
    },
  });

  if (!mentorProfile) {
    redirect("/mentorship/become-a-mentor");
  }

  const verificationStatus = mentorProfile.verification?.status ?? mentorProfile.verificationStatus ?? "UNVERIFIED";
  const hasM2Profile =
    mentorProfile.fromRole != null &&
    mentorProfile.toRole != null &&
    mentorProfile.keyFactor1 != null &&
    mentorProfile.statementTransitionMade != null &&
    (mentorProfile.m2FocusAreas?.length ?? 0) > 0 &&
    (mentorProfile.availabilityWindows?.length ?? 0) > 0;

  let progress: {
    isUnlocked: boolean;
    canChargeMentees: boolean;
    verifiedOutcomeCount: number;
    stenoRate: number | null;
    upheldDisputeCount: number;
    monthsOnPlatform?: number;
    reVerificationCurrent?: boolean;
    lockedReason?: string | null;
    reasons?: string[];
  } | null = null;
  if (session.user.id && hasM2Profile) {
    const eligibility = await checkMonetisationEligibility(session.user.id);
    progress = {
      isUnlocked: mentorProfile.monetisationStatus?.isUnlocked ?? false,
      canChargeMentees: mentorProfile.canChargeMentees ?? false,
      verifiedOutcomeCount: eligibility.verifiedOutcomeCount,
      stenoRate: eligibility.stenoRate,
      upheldDisputeCount: eligibility.upheldDisputeCount,
      monthsOnPlatform: eligibility.monthsOnPlatform,
      reVerificationCurrent: eligibility.reVerificationCurrent,
      lockedReason: mentorProfile.monetisationStatus?.lockedReason ?? null,
      reasons: eligibility.reasons,
    };
  }

  return (
    <div className="min-h-screen bg-[#F7F6F1] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <MentorDashboardClient
          verificationStatus={verificationStatus}
          hasM2Profile={hasM2Profile}
          profile={mentorProfile}
          monetisationProgress={progress ?? undefined}
        />
      </div>
    </div>
  );
}
