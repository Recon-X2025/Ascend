/**
 * Phase 20: Platform Intelligence & Investor Metrics.
 * All metric computation from existing DB — no external APIs.
 */

import type { PlanType } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import { startOfDay, subDays, subWeeks, startOfWeek, endOfWeek } from "date-fns";

const EXCHANGE_RATE_USD_INR = Number(process.env.EXCHANGE_RATE_USD_INR) || 84;

// Monthly recurring revenue per plan (INR). FREE = 0.
const MONTHLY_PRICE_INR: Record<PlanType, number> = {
  FREE: 0,
  SEEKER_PREMIUM: 499,
  SEEKER_ELITE: 999,
  MENTOR_MARKETPLACE: 1199,
  RECRUITER_STARTER: 2999,
  RECRUITER_PRO: 7999,
  RECRUITER_ENTERPRISE: 19999,
};

export type InvestorSnapshotPayload = {
  snapshotDate: Date;
  totalUsers: number;
  newUsersToday: number;
  dau: number;
  wau: number;
  mau: number;
  dauMauRatio: number;
  activeSeekers: number;
  profileCompletionAvg: number;
  resumesGenerated: number;
  applicationsSubmitted: number;
  activeCompanies: number;
  activeRecruiters: number;
  jobPostsActive: number;
  avgApplicantsPerJob: number;
  mentorsVerified: number;
  activeEngagements: number;
  verifiedOutcomes: number;
  outcomeVerificationRate: number;
  mrrInr: number;
  mrrUsd: number;
  arpu: number;
  payingUsers: number;
  churnRate: number;
  ltv: number;
  referralConversionRate: number;
  viralCoefficient: number;
  organicSignupRate: number;
  aiInteractionsToday: number;
  aiInteractions30d: number;
  resumeOptimisations: number;
  fitScoresComputed: number;
};

export async function computeInvestorSnapshot(snapshotDate: Date): Promise<InvestorSnapshotPayload> {
  const dayStart = startOfDay(snapshotDate);
  const dayEnd = startOfDay(subDays(snapshotDate, -1));
  const weekStart = subDays(dayStart, 6);
  const monthStart = subDays(dayStart, 29);

  const [
    totalUsers,
    newUsersToday,
    dauList,
    wauList,
    mauList,
    seekerPersonaCount,
    profileAgg,
    resumesGenerated,
    applicationsSubmitted,
    activeCompanies,
    activeRecruiters,
    jobPostsActive,
    appCountForJobs,
    mentorsVerified,
    activeEngagements,
    outcomeTotal,
    outcomeVerified,
    userSubs,
    companySubs,
    userSubsCancelled30d,
    companySubsCancelled30d,
    aiToday,
    ai30d,
    resumeOptCount,
    fitScoreCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
    prisma.analyticsEvent.groupBy({ by: ["userId"], where: { userId: { not: null }, createdAt: { gte: dayStart, lt: dayEnd } } }),
    prisma.analyticsEvent.groupBy({ by: ["userId"], where: { userId: { not: null }, createdAt: { gte: weekStart, lt: dayEnd } } }),
    prisma.analyticsEvent.groupBy({ by: ["userId"], where: { userId: { not: null }, createdAt: { gte: monthStart, lt: dayEnd } } }),
    prisma.user.count({ where: { persona: { in: ["ACTIVE_SEEKER", "EARLY_CAREER"] } } }),
    prisma.jobSeekerProfile.aggregate({ _avg: { completionScore: true }, _count: true }),
    prisma.resumeVersion.count(),
    prisma.jobApplication.count(),
    prisma.company.count({ where: { jobPosts: { some: { status: "ACTIVE" } } } }),
    prisma.recruiterProfile.count(),
    prisma.jobPost.count({ where: { status: "ACTIVE" } }),
    prisma.jobApplication.groupBy({ by: ["jobPostId"], _count: true }),
    prisma.mentorProfile.count({ where: { verificationStatus: "VERIFIED", isPublic: true } }),
    prisma.mentorshipContract.count({ where: { status: "ACTIVE" } }),
    prisma.mentorshipOutcome.count(),
    prisma.mentorshipOutcome.count({ where: { status: "VERIFIED" } }),
    prisma.userSubscription.findMany({ where: { status: "ACTIVE" }, select: { plan: true } }),
    prisma.companySubscription.findMany({ where: { status: "ACTIVE" }, select: { plan: true } }),
    prisma.userSubscription.count({ where: { status: "CANCELLED", updatedAt: { gte: subDays(dayStart, 30) } } }),
    prisma.companySubscription.count({ where: { status: "CANCELLED", updatedAt: { gte: subDays(dayStart, 30) } } }),
    prisma.aIInteraction.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
    prisma.aIInteraction.count({ where: { createdAt: { gte: monthStart, lt: dayEnd } } }),
    prisma.optimisationSession.count(),
    prisma.fitScore.count(),
  ]);

  const dau = dauList.length;
  const wau = wauList.length;
  const mau = mauList.length;
  const dauMauRatio = mau > 0 ? dau / mau : 0;

  const profileCompletionAvg = profileAgg._count > 0 ? (profileAgg._avg.completionScore ?? 0) : 0;
  const totalApps = appCountForJobs.reduce((s, g) => s + g._count, 0);
  const avgApplicantsPerJob = jobPostsActive > 0 ? totalApps / jobPostsActive : 0;

  const outcomeVerificationRate = outcomeTotal > 0 ? outcomeVerified / outcomeTotal : 0;

  let mrrInr = 0;
  for (const s of userSubs) {
    mrrInr += MONTHLY_PRICE_INR[s.plan] ?? 0;
  }
  for (const s of companySubs) {
    mrrInr += MONTHLY_PRICE_INR[s.plan] ?? 0;
  }
  const mrrUsd = mrrInr / EXCHANGE_RATE_USD_INR;
  const payingUsers = userSubs.length + companySubs.length;
  const arpu = payingUsers > 0 ? mrrInr / payingUsers : 0;

  const totalActiveSubsStart = userSubs.length + companySubs.length;
  const churned = userSubsCancelled30d + companySubsCancelled30d;
  const churnRate = totalActiveSubsStart > 0 ? churned / totalActiveSubsStart : 0;
  const ltv = churnRate > 0 ? arpu / churnRate : 0;

  return {
    snapshotDate: dayStart,
    totalUsers,
    newUsersToday,
    dau,
    wau,
    mau,
    dauMauRatio,
    activeSeekers: seekerPersonaCount,
    profileCompletionAvg,
    resumesGenerated,
    applicationsSubmitted,
    activeCompanies,
    activeRecruiters,
    jobPostsActive,
    avgApplicantsPerJob,
    mentorsVerified,
    activeEngagements,
    verifiedOutcomes: outcomeVerified,
    outcomeVerificationRate,
    mrrInr,
    mrrUsd,
    arpu,
    payingUsers,
    churnRate,
    ltv,
    referralConversionRate: 0,
    viralCoefficient: 0,
    organicSignupRate: 1,
    aiInteractionsToday: aiToday,
    aiInteractions30d: ai30d,
    resumeOptimisations: resumeOptCount,
    fitScoresComputed: fitScoreCount,
  };
}

export type RetentionCohortRow = {
  weekLabel: string;
  registered: number;
  w1: number;
  w2: number;
  w4: number;
  w8: number;
  w12: number;
};

export async function getRetentionCohorts(): Promise<{ cohorts: RetentionCohortRow[] }> {
  const ninetyDaysAgo = subDays(new Date(), 90);
  const usersByWeek = await prisma.user.findMany({
    where: { createdAt: { gte: ninetyDaysAgo } },
    select: { id: true, createdAt: true },
  });

  const weekToUsers = new Map<string, string[]>();
  for (const u of usersByWeek) {
    const weekStart = startOfWeek(u.createdAt, { weekStartsOn: 1 });
    const key = weekStart.toISOString().slice(0, 10);
    if (!weekToUsers.has(key)) weekToUsers.set(key, []);
    weekToUsers.get(key)!.push(u.id);
  }

  const cohorts: RetentionCohortRow[] = [];
  const sortedWeeks = Array.from(weekToUsers.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  for (const [weekLabel, userIds] of sortedWeeks) {
    const registered = userIds.length;
    if (registered === 0) continue;

    const cohortStart = new Date(weekLabel + "T00:00:00.000Z");

    const activeInWeek = async (offsetWeeks: number) => {
      const wStart = startOfWeek(subWeeks(cohortStart, -offsetWeeks), { weekStartsOn: 1 });
      const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
      const events = await prisma.analyticsEvent.findMany({
        where: { userId: { in: userIds }, createdAt: { gte: wStart, lte: wEnd } },
        select: { userId: true },
        distinct: ["userId"],
      });
      return events.length;
    };

    const [a1, a2, a4, a8, a12] = await Promise.all([
      activeInWeek(1),
      activeInWeek(2),
      activeInWeek(4),
      activeInWeek(8),
      activeInWeek(12),
    ]);

    cohorts.push({
      weekLabel,
      registered,
      w1: registered > 0 ? a1 / registered : 0,
      w2: registered > 0 ? a2 / registered : 0,
      w4: registered > 0 ? a4 / registered : 0,
      w8: registered > 0 ? a8 / registered : 0,
      w12: registered > 0 ? a12 / registered : 0,
    });
  }

  return { cohorts };
}

export async function getNorthStarMetric(): Promise<{
  value: number;
  trend: string;
  label: string;
}> {
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const fourteenDaysAgo = subDays(now, 14);

  const activeContracts = await prisma.mentorshipContract.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });
  const contractIds = activeContracts.map((c) => c.id);

  await prisma.engagementSession.count({
    where: {
      contractId: { in: contractIds },
      status: "COMPLETED",
      completedAt: { gte: sevenDaysAgo },
    },
  });

  await prisma.engagementSession.count({
    where: {
      contractId: { in: contractIds },
      status: "COMPLETED",
      completedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
    },
  });

  const contractsWithActivity = await prisma.engagementSession.findMany({
    where: {
      contractId: { in: contractIds },
      status: "COMPLETED",
      completedAt: { gte: sevenDaysAgo },
    },
    select: { contractId: true },
    distinct: ["contractId"],
  });
  const value = contractsWithActivity.length;
  const prevValue = await prisma.engagementSession.findMany({
    where: {
      contractId: { in: contractIds },
      status: "COMPLETED",
      completedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
    },
    select: { contractId: true },
    distinct: ["contractId"],
  });
  const prevCount = prevValue.length;
  const diff = value - prevCount;
  const trend = diff >= 0 ? `+${diff} vs last week` : `${diff} vs last week`;

  return {
    value,
    trend,
    label: "Active Mentorship Engagements",
  };
}

export type RevenueWaterfallMonth = {
  month: string;
  newMrr: number;
  expansionMrr: number;
  churnedMrr: number;
  netNewMrr: number;
};

export async function getRevenueWaterfall(): Promise<RevenueWaterfallMonth[]> {
  const months: RevenueWaterfallMonth[] = [];
  const rate = EXCHANGE_RATE_USD_INR;

  for (let i = 5; i >= 0; i--) {
    const end = startOfDay(subDays(new Date(), i * 30));
    const start = startOfDay(subDays(new Date(), (i + 1) * 30));

    const payments = await prisma.paymentEvent.findMany({
      where: {
        createdAt: { gte: start, lt: end },
        status: "COMPLETED",
      },
      select: { amount: true, currency: true, description: true, metadata: true },
    });

    let newMrr = 0;
    let expansionMrr = 0;
    let churnedMrr = 0;

    for (const p of payments) {
      const amountInr = p.currency === "USD" ? p.amount * rate : p.amount;
      const desc = (p.description ?? "").toLowerCase();
      const meta = (p.metadata as { type?: string }) ?? {};
      if (desc.includes("subscription") || meta.type === "subscription") {
        if (desc.includes("upgrade") || desc.includes("expansion")) expansionMrr += amountInr;
        else newMrr += amountInr;
      }
      if (desc.includes("cancel") || desc.includes("churn")) churnedMrr += amountInr;
    }

    months.push({
      month: start.toISOString().slice(0, 7),
      newMrr,
      expansionMrr,
      churnedMrr,
      netNewMrr: newMrr + expansionMrr - churnedMrr,
    });
  }

  return months;
}

export async function checkMetricAlerts(): Promise<void> {
  const latest = await prisma.investorSnapshot.findFirst({
    orderBy: { snapshotDate: "desc" },
  });
  if (!latest) return;

  const alerts = await prisma.metricAlert.findMany({
    where: { isActive: true },
  });

  const metricValues: Record<string, number> = {
    dauMauRatio: latest.dauMauRatio,
    churnRate: latest.churnRate,
    mrrInr: latest.mrrInr,
    payingUsers: latest.payingUsers,
    dau: latest.dau,
    mau: latest.mau,
    verifiedOutcomes: latest.verifiedOutcomes,
    activeEngagements: latest.activeEngagements,
  };

  const opsEmail = process.env.OPS_EMAIL;
  for (const alert of alerts) {
    const current = metricValues[alert.metric] ?? 0;
    const crossed =
      alert.direction === "ABOVE" ? current >= alert.threshold : current <= alert.threshold;

    if (crossed && !alert.triggeredAt) {
      await prisma.metricAlert.update({
        where: { id: alert.id },
        data: { triggeredAt: new Date() },
      });
      if (opsEmail) {
        const { sendMetricAlertTriggered } = await import("@/lib/email/templates/investor/metric-alert-triggered");
        await sendMetricAlertTriggered({
          to: opsEmail,
          metric: alert.metric,
          threshold: alert.threshold,
          direction: alert.direction,
          currentValue: current,
          message: alert.message,
        });
      }
      // Outcome event: PHASE20_METRIC_ALERT_TRIGGERED (no userId for system alerts)
    } else if (!crossed && alert.triggeredAt && !alert.resolvedAt) {
      await prisma.metricAlert.update({
        where: { id: alert.id },
        data: { resolvedAt: new Date() },
      });
    }
  }
}
