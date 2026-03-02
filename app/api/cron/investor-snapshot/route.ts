import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { startOfDay, subDays } from "date-fns";
import { computeInvestorSnapshot, checkMetricAlerts } from "@/lib/intelligence/platform";
import { logAudit } from "@/lib/audit/log";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * GET /api/cron/investor-snapshot
 * Run daily at 00:30 IST. Computes snapshot for yesterday, upserts, runs metric alerts.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const snapshotDate = startOfDay(subDays(now, 1));

  const payload = await computeInvestorSnapshot(snapshotDate);

  await prisma.investorSnapshot.upsert({
    where: { snapshotDate: payload.snapshotDate },
    create: {
      snapshotDate: payload.snapshotDate,
      totalUsers: payload.totalUsers,
      newUsersToday: payload.newUsersToday,
      dau: payload.dau,
      wau: payload.wau,
      mau: payload.mau,
      dauMauRatio: payload.dauMauRatio,
      activeSeekers: payload.activeSeekers,
      profileCompletionAvg: payload.profileCompletionAvg,
      resumesGenerated: payload.resumesGenerated,
      applicationsSubmitted: payload.applicationsSubmitted,
      activeCompanies: payload.activeCompanies,
      activeRecruiters: payload.activeRecruiters,
      jobPostsActive: payload.jobPostsActive,
      avgApplicantsPerJob: payload.avgApplicantsPerJob,
      mentorsVerified: payload.mentorsVerified,
      activeEngagements: payload.activeEngagements,
      verifiedOutcomes: payload.verifiedOutcomes,
      outcomeVerificationRate: payload.outcomeVerificationRate,
      mrrInr: payload.mrrInr,
      mrrUsd: payload.mrrUsd,
      arpu: payload.arpu,
      payingUsers: payload.payingUsers,
      churnRate: payload.churnRate,
      ltv: payload.ltv,
      referralConversionRate: payload.referralConversionRate,
      viralCoefficient: payload.viralCoefficient,
      organicSignupRate: payload.organicSignupRate,
      aiInteractionsToday: payload.aiInteractionsToday,
      aiInteractions30d: payload.aiInteractions30d,
      resumeOptimisations: payload.resumeOptimisations,
      fitScoresComputed: payload.fitScoresComputed,
    },
    update: {
      totalUsers: payload.totalUsers,
      newUsersToday: payload.newUsersToday,
      dau: payload.dau,
      wau: payload.wau,
      mau: payload.mau,
      dauMauRatio: payload.dauMauRatio,
      activeSeekers: payload.activeSeekers,
      profileCompletionAvg: payload.profileCompletionAvg,
      resumesGenerated: payload.resumesGenerated,
      applicationsSubmitted: payload.applicationsSubmitted,
      activeCompanies: payload.activeCompanies,
      activeRecruiters: payload.activeRecruiters,
      jobPostsActive: payload.jobPostsActive,
      avgApplicantsPerJob: payload.avgApplicantsPerJob,
      mentorsVerified: payload.mentorsVerified,
      activeEngagements: payload.activeEngagements,
      verifiedOutcomes: payload.verifiedOutcomes,
      outcomeVerificationRate: payload.outcomeVerificationRate,
      mrrInr: payload.mrrInr,
      mrrUsd: payload.mrrUsd,
      arpu: payload.arpu,
      payingUsers: payload.payingUsers,
      churnRate: payload.churnRate,
      ltv: payload.ltv,
      referralConversionRate: payload.referralConversionRate,
      viralCoefficient: payload.viralCoefficient,
      organicSignupRate: payload.organicSignupRate,
      aiInteractionsToday: payload.aiInteractionsToday,
      aiInteractions30d: payload.aiInteractions30d,
      resumeOptimisations: payload.resumeOptimisations,
      fitScoresComputed: payload.fitScoresComputed,
    },
  });

  await checkMetricAlerts();

  await logAudit({
    category: "SYSTEM",
    action: "INVESTOR_SNAPSHOT_COMPUTED",
    targetType: "InvestorSnapshot",
    targetId: payload.snapshotDate.toISOString(),
    metadata: {
      snapshotDate: payload.snapshotDate.toISOString(),
      dauMauRatio: payload.dauMauRatio,
      mrrInr: payload.mrrInr,
      payingUsers: payload.payingUsers,
    },
  });

  return NextResponse.json({
    ok: true,
    snapshotDate: payload.snapshotDate.toISOString(),
  });
}
