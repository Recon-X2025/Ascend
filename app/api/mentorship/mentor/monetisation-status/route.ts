/**
 * GET /api/mentorship/mentor/monetisation-status
 * Mentor only. Returns monetisation unlock status and progress.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import {
  checkMonetisationEligibility,
  MONETISATION_UNLOCK_CRITERIA,
  MENTORSHIP_PRICING_RULES,
} from "@/lib/mentorship/monetisation";
import { getMentorActivePlan } from "@/lib/payments/plans";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
    include: { monetisationStatus: true },
  });
  if (!profile) {
    return NextResponse.json({ success: false, error: "Mentor profile required" }, { status: 403 });
  }

  const eligibility = await checkMonetisationEligibility(session.user.id);
  const hasMarketplacePlan = (await getMentorActivePlan(session.user.id)) != null;
  const canChargeMentees = profile.canChargeMentees ?? false;

  return NextResponse.json({
    isUnlocked: profile.monetisationStatus?.isUnlocked ?? false,
    canChargeMentees,
    hasMarketplacePlan,
    sessionFeePaise: profile.sessionFeePaise,
    floorPaise: MENTORSHIP_PRICING_RULES.sessionFloorPaise,
    ceilingPaise: MENTORSHIP_PRICING_RULES.sessionCeilingPaise,
    progress: {
      verifiedOutcomeCount: eligibility.verifiedOutcomeCount,
      minVerifiedOutcomes: MONETISATION_UNLOCK_CRITERIA.minVerifiedOutcomes,
      stenoRate: eligibility.stenoRate,
      minStenoRate: MONETISATION_UNLOCK_CRITERIA.minStenoRate,
      upheldDisputeCount: eligibility.upheldDisputeCount,
      maxUpheldDisputes: MONETISATION_UNLOCK_CRITERIA.maxUpheldDisputes,
      monthsOnPlatform: eligibility.monthsOnPlatform,
      minMonthsOnPlatform: MONETISATION_UNLOCK_CRITERIA.minMonthsOnPlatform,
      reVerificationCurrent: eligibility.reVerificationCurrent,
    },
    lockedReason: profile.monetisationStatus?.lockedReason ?? null,
    reasons: eligibility.reasons,
    lastCheckedAt: profile.monetisationStatus?.lastCheckedAt ?? null,
  });
}
