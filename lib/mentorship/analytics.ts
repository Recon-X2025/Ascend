/**
 * M-17: Mentorship analytics — platform snapshot, mentor snapshot, breakdowns, progress, mentee summary.
 */

import { prisma } from "@/lib/prisma/client";
import { subDays, differenceInDays } from "date-fns";
import type { MentorTier } from "@prisma/client";
import { getRevenueSummary, getMentorPayoutSummary } from "@/lib/escrow/revenue";

const STALLED_DAYS = 14;
const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 100;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Idempotent upsert for snapshotDate (start of day UTC). */
export async function computePlatformSnapshot(snapshotDate: Date): Promise<void> {
  const startOfDay = new Date(snapshotDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const weekStart = subDays(startOfDay, 7);

  const [
    activeContracts,
    newThisWeek,
    completedContracts,
    allOutcomes,
    verifiedOutcomes,
    disputedOutcomes,
    allMilestones,
    completeMilestones,
    totalSessions,
    sessionsThisWeek,
    mentorProfiles,
    contractsWithSessions,
  ] = await Promise.all([
    prisma.mentorshipContract.count({
      where: { status: { in: ["ACTIVE", "PAUSED"] } },
    }),
    prisma.mentorshipContract.count({
      where: { status: "ACTIVE", activatedAt: { gte: weekStart, lte: startOfDay } },
    }),
    prisma.mentorshipContract.findMany({
      where: { status: "COMPLETED", engagementStart: { not: null }, completedAt: { not: null } },
      select: { engagementStart: true, completedAt: true },
    }),
    prisma.mentorshipOutcome.findMany({
      include: { contract: { select: { engagementStart: true } } },
    }),
    prisma.mentorshipOutcome.count({ where: { status: "VERIFIED" } }),
    prisma.mentorshipOutcome.count({ where: { status: "DISPUTED" } }),
    prisma.engagementMilestone.count(),
    prisma.engagementMilestone.count({ where: { status: "COMPLETE" } }),
    prisma.engagementSession.count({ where: { completedAt: { not: null } } }),
    prisma.engagementSession.count({
      where: { completedAt: { gte: weekStart, lte: startOfDay } },
    }),
    prisma.mentorProfile.findMany({
      select: { id: true, userId: true, tier: true, disputeRate: true, verificationStatus: true, isVerified: true },
    }),
    prisma.mentorshipContract.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        sessions: {
          where: { completedAt: { not: null } },
          orderBy: { completedAt: "desc" },
          take: 1,
          select: { completedAt: true },
        },
      },
    }),
  ]);

  const stalledCutoff = subDays(startOfDay, STALLED_DAYS);
  const stalledEngagements = contractsWithSessions.filter((c) => {
    const last = c.sessions[0]?.completedAt;
    return !last || last < stalledCutoff;
  }).length;

  const avgEngagementDays =
    completedContracts.length > 0
      ? completedContracts.reduce((sum, c) => {
          const start = c.engagementStart!;
          const end = c.completedAt!;
          return sum + differenceInDays(end, start);
        }, 0) / completedContracts.length
      : 0;

  const totalOutcomes = allOutcomes.length;
  const outcomeVerificationRate = totalOutcomes > 0 ? verifiedOutcomes / totalOutcomes : 0;

  const timeToOutcomeDays = allOutcomes
    .filter((o) => o.status === "VERIFIED" && o.menteeConfirmedAt && o.contract?.engagementStart)
    .map((o) => differenceInDays(o.menteeConfirmedAt!, o.contract!.engagementStart!));
  const avgTimeToOutcomeDays =
    timeToOutcomeDays.length > 0
      ? timeToOutcomeDays.reduce((a, b) => a + b, 0) / timeToOutcomeDays.length
      : 0;

  const withCheckIn = allOutcomes.filter((o) => o.checkInStatus !== null);
  const checkinCompleted = allOutcomes.filter((o) => o.checkInStatus === "COMPLETED").length;
  const sixMonthCheckinRate = withCheckIn.length > 0 ? checkinCompleted / withCheckIn.length : 0;

  const mentorsByTier = { RISING: 0, ESTABLISHED: 0, ELITE: 0 };
  let avgDisputeRate = 0;
  let highDisputeRateMentors = 0;
  for (const p of mentorProfiles) {
    mentorsByTier[p.tier as keyof typeof mentorsByTier] =
      (mentorsByTier[p.tier as keyof typeof mentorsByTier] ?? 0) + 1;
    if (p.disputeRate != null) {
      avgDisputeRate += p.disputeRate;
      if (p.disputeRate > 0.25) highDisputeRateMentors++;
    }
  }
  if (mentorProfiles.length > 0) avgDisputeRate /= mentorProfiles.length;

  const activeMentorIds = await prisma.mentorshipContract
    .findMany({
      where: { status: { in: ["ACTIVE", "PAUSED"] } },
      select: { mentorUserId: true },
      distinct: ["mentorUserId"],
    })
    .then((r) => new Set(r.map((x) => x.mentorUserId)));
  const activeMentors = activeMentorIds.size;
  const verifiedMentors = mentorProfiles.filter(
    (p) => p.verificationStatus === "VERIFIED" || p.isVerified
  ).length;

  const completedTotal = completedContracts.length;
  const avgSessionsPerEngagement =
    completedTotal > 0 ? totalSessions / (completedTotal + activeContracts) : 0;
  const milestonesCompletedRate =
    allMilestones > 0 ? completeMilestones / allMilestones : 0;

  const revenueSummary = await getRevenueSummary(startOfDay, startOfDay);

  await prisma.mentorshipAnalyticsSnapshot.upsert({
    where: { snapshotDate: startOfDay },
    create: {
      snapshotDate: startOfDay,
      activeEngagements: activeContracts,
      newEngagementsThisWeek: newThisWeek,
      completedEngagementsTotal: completedTotal,
      stalledEngagements,
      averageEngagementDays: avgEngagementDays,
      outcomesSubmittedTotal: totalOutcomes,
      outcomesVerifiedTotal: verifiedOutcomes,
      outcomesDisputedTotal: disputedOutcomes,
      outcomeVerificationRate,
      avgTimeToOutcomeDays,
      sixMonthCheckinRate,
      totalMentors: mentorProfiles.length,
      verifiedMentors,
      activeMentors,
      mentorsByTier: mentorsByTier as object,
      avgDisputeRate,
      highDisputeRateMentors,
      sessionsCompletedTotal: totalSessions,
      sessionsCompletedThisWeek: sessionsThisWeek,
      avgSessionsPerEngagement,
      milestonesCompletedRate,
      platformRevenuePaise: revenueSummary.platformFeePaise,
      mentorPayoutsPaise: revenueSummary.mentorPayoutPaise,
      pilotWaivedRevenuePaise: revenueSummary.pilotWaivedPaise,
    },
    update: {
      activeEngagements: activeContracts,
      newEngagementsThisWeek: newThisWeek,
      completedEngagementsTotal: completedTotal,
      stalledEngagements,
      averageEngagementDays: avgEngagementDays,
      outcomesSubmittedTotal: totalOutcomes,
      outcomesVerifiedTotal: verifiedOutcomes,
      outcomesDisputedTotal: disputedOutcomes,
      outcomeVerificationRate,
      avgTimeToOutcomeDays,
      sixMonthCheckinRate,
      totalMentors: mentorProfiles.length,
      verifiedMentors,
      activeMentors,
      mentorsByTier: mentorsByTier as object,
      avgDisputeRate,
      highDisputeRateMentors,
      sessionsCompletedTotal: totalSessions,
      sessionsCompletedThisWeek: sessionsThisWeek,
      avgSessionsPerEngagement,
      milestonesCompletedRate,
      platformRevenuePaise: revenueSummary.platformFeePaise,
      mentorPayoutsPaise: revenueSummary.mentorPayoutPaise,
      pilotWaivedRevenuePaise: revenueSummary.pilotWaivedPaise,
    },
  });
}

/** Upsert MentorAnalyticsSnapshot for (mentorId, snapshotDate). */
export async function computeMentorSnapshot(mentorId: string, snapshotDate: Date): Promise<void> {
  const startOfDay = new Date(snapshotDate);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: mentorId },
    select: { id: true, tier: true, verifiedOutcomeCount: true, disputeRate: true },
  });
  if (!profile) return;

  const applications = await prisma.mentorApplication.findMany({
    where: { mentorProfile: { userId: mentorId } },
    select: { status: true },
  });
  const applicationsReceived = applications.length;
  const applicationsAccepted = applications.filter((a) => a.status === "ACCEPTED").length;
  const applicationsDeclined = applications.filter((a) => a.status === "DECLINED").length;
  const acceptanceRate =
    applicationsReceived > 0 ? applicationsAccepted / applicationsReceived : 0;

  const contracts = await prisma.mentorshipContract.findMany({
    where: { mentorUserId: mentorId },
    include: {
      sessions: { where: { completedAt: { not: null } }, select: { id: true } },
      milestones: { select: { id: true, status: true } },
      outcome: { select: { id: true, status: true } },
    },
  });
  const engagementsTotal = contracts.length;
  const engagementsActive = contracts.filter((c) =>
    ["ACTIVE", "PAUSED"].includes(c.status)
  ).length;
  const engagementsCompleted = contracts.filter((c) => c.status === "COMPLETED").length;
  const completionRate = engagementsTotal > 0 ? engagementsCompleted / engagementsTotal : 0;

  const outcomesSubmitted = contracts.filter((c) => c.outcome != null).length;
  const outcomesVerified = contracts.filter((c) => c.outcome?.status === "VERIFIED").length;
  const outcomesDisputed = contracts.filter((c) => c.outcome?.status === "DISPUTED").length;
  const outcomeRate = outcomesSubmitted > 0 ? outcomesVerified / outcomesSubmitted : 0;

  const sessionsCompleted = contracts.reduce((sum, c) => sum + c.sessions.length, 0);
  const avgSessionsPerEngagement =
    engagementsTotal > 0 ? sessionsCompleted / engagementsTotal : 0;

  const payoutSummary = await getMentorPayoutSummary(mentorId);

  await prisma.mentorAnalyticsSnapshot.upsert({
    where: { mentorId_snapshotDate: { mentorId, snapshotDate: startOfDay } },
    create: {
      mentorId,
      snapshotDate: startOfDay,
      applicationsReceived,
      applicationsAccepted,
      applicationsDeclined,
      acceptanceRate,
      engagementsActive,
      engagementsCompleted,
      engagementsTotal,
      completionRate,
      outcomesSubmitted,
      outcomesVerified,
      outcomesDisputed,
      outcomeRate,
      sessionsCompleted,
      avgSessionsPerEngagement,
      currentTier: profile.tier,
      verifiedOutcomeCount: profile.verifiedOutcomeCount,
      disputeRate: profile.disputeRate ?? 0,
      totalEarnedPaise: payoutSummary.totalEarnedPaise,
      pendingEarnedPaise: payoutSummary.pendingEarnedPaise,
      inEscrowPaise: payoutSummary.inEscrowPaise,
    },
    update: {
      applicationsReceived,
      applicationsAccepted,
      applicationsDeclined,
      acceptanceRate,
      engagementsActive,
      engagementsCompleted,
      engagementsTotal,
      completionRate,
      outcomesSubmitted,
      outcomesVerified,
      outcomesDisputed,
      outcomeRate,
      sessionsCompleted,
      avgSessionsPerEngagement,
      currentTier: profile.tier,
      verifiedOutcomeCount: profile.verifiedOutcomeCount,
      disputeRate: profile.disputeRate ?? 0,
      totalEarnedPaise: payoutSummary.totalEarnedPaise,
      pendingEarnedPaise: payoutSummary.pendingEarnedPaise,
      inEscrowPaise: payoutSummary.inEscrowPaise,
    },
  });
}

/** All mentors with ≥1 engagement; batched 50 at a time, 100ms delay. Optional onSampled(mentorId, outcomeRate, disputeRate) called for ~10% sample. */
export async function computeAllMentorSnapshots(
  snapshotDate: Date,
  onSampled?: (mentorId: string, outcomeRate: number, disputeRate: number) => void
): Promise<number> {
  const mentorsWithEngagement = await prisma.mentorshipContract.findMany({
    select: { mentorUserId: true },
    distinct: ["mentorUserId"],
  });
  const mentorIds = Array.from(new Set(mentorsWithEngagement.map((c) => c.mentorUserId)));
  let processed = 0;
  for (let i = 0; i < mentorIds.length; i += BATCH_SIZE) {
    const batch = mentorIds.slice(i, i + BATCH_SIZE);
    for (const mentorId of batch) {
      await computeMentorSnapshot(mentorId, snapshotDate);
      processed++;
      if (onSampled && Math.random() < 0.1) {
        const startOfDay = new Date(snapshotDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const snap = await prisma.mentorAnalyticsSnapshot.findUnique({
          where: { mentorId_snapshotDate: { mentorId, snapshotDate: startOfDay } },
          select: { outcomeRate: true, disputeRate: true },
        });
        if (snap) onSampled(mentorId, snap.outcomeRate, snap.disputeRate);
      }
    }
    if (i + BATCH_SIZE < mentorIds.length) await delay(BATCH_DELAY_MS);
  }
  return processed;
}

export async function getTransitionOutcomeBreakdown(): Promise<
  Array<{ transition: string; engagements: number; verifiedOutcomes: number; outcomeRate: number; avgDays: number }>
> {
  const outcomes = await prisma.mentorshipOutcome.findMany({
    include: {
      contract: { select: { engagementStart: true } },
    },
  });
  const byTransition: Record<
    string,
    { engagements: number; verified: number; days: number[] }
  > = {};
  for (const o of outcomes) {
    const t = o.transitionType || "Other";
    if (!byTransition[t]) byTransition[t] = { engagements: 0, verified: 0, days: [] };
    byTransition[t].engagements += 1;
    if (o.status === "VERIFIED") {
      byTransition[t].verified += 1;
      if (o.menteeConfirmedAt && o.contract?.engagementStart) {
        byTransition[t].days.push(
          differenceInDays(o.menteeConfirmedAt, o.contract.engagementStart)
        );
      }
    }
  }
  const arr = Object.entries(byTransition).map(([transition, data]) => ({
    transition,
    engagements: data.engagements,
    verifiedOutcomes: data.verified,
    outcomeRate: data.engagements > 0 ? data.verified / data.engagements : 0,
    avgDays:
      data.days.length > 0
        ? data.days.reduce((a, b) => a + b, 0) / data.days.length
        : 0,
  }));
  arr.sort((a, b) => b.engagements - a.engagements);
  return arr.slice(0, 10);
}

export async function getDisputeRateByTier(): Promise<Record<string, number>> {
  const profiles = await prisma.mentorProfile.findMany({
    where: { disputeRate: { not: null } },
    select: { tier: true, disputeRate: true },
  });
  const byTier: Record<string, { sum: number; count: number }> = {
    RISING: { sum: 0, count: 0 },
    ESTABLISHED: { sum: 0, count: 0 },
    ELITE: { sum: 0, count: 0 },
  };
  for (const p of profiles) {
    const t = p.tier as keyof typeof byTier;
    if (byTier[t]) {
      byTier[t].sum += p.disputeRate ?? 0;
      byTier[t].count += 1;
    }
  }
  const result: Record<string, number> = {};
  for (const [tier, data] of Object.entries(byTier)) {
    result[tier] = data.count > 0 ? data.sum / data.count : 0;
  }
  return result;
}

export async function getMentorProgressToNextTier(mentorId: string): Promise<{
  currentTier: string;
  nextTier: string | null;
  verifiedOutcomes: number;
  requiredForNext: number;
  remaining: number;
  progressPercent: number;
  blockers: string[];
}> {
  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: mentorId },
    select: { tier: true, verifiedOutcomeCount: true, disputeRate: true },
  });
  if (!profile) {
    return {
      currentTier: "RISING",
      nextTier: null,
      verifiedOutcomes: 0,
      requiredForNext: 10,
      remaining: 10,
      progressPercent: 0,
      blockers: [],
    };
  }

  const nextTierByCurrent: Record<string, string | null> = {
    RISING: "ESTABLISHED",
    ESTABLISHED: "ELITE",
    ELITE: null,
  };
  const requiredOutcomes: Record<string, number> = {
    RISING: 5,
    ESTABLISHED: 10,
    ELITE: 10,
  };

  const currentTier = profile.tier as MentorTier;
  const nextTier = nextTierByCurrent[currentTier] ?? null;
  const verifiedOutcomes = profile.verifiedOutcomeCount;
  const requiredForNext = nextTier ? requiredOutcomes[nextTier] ?? 10 : 10;
  const remaining = Math.max(0, requiredForNext - verifiedOutcomes);
  const progressPercent = nextTier
    ? Math.min(100, Math.round((verifiedOutcomes / requiredForNext) * 100))
    : 100;

  const blockers: string[] = [];
  if (profile.disputeRate != null && profile.disputeRate > 0.25) {
    blockers.push(
      `Dispute rate ${(profile.disputeRate * 100).toFixed(0)}% — must drop below 25%`
    );
  }

  return {
    currentTier,
    nextTier,
    verifiedOutcomes,
    requiredForNext,
    remaining,
    progressPercent,
    blockers,
  };
}

export async function getMenteeEngagementSummary(menteeId: string): Promise<{
  applicationsSubmitted: number;
  engagementsCompleted: number;
  engagementsActive: number;
  goalsAchieved: number;
  actionItemsPending: number;
  sixMonthCheckinDue: boolean;
  checkinsCompleted: number;
}> {
  const [applications, contracts] = await Promise.all([
    prisma.mentorApplication.count({ where: { menteeId } }),
    prisma.mentorshipContract.findMany({
      where: { menteeUserId: menteeId },
      include: {
        outcome: { select: { status: true, checkInStatus: true, checkInDueAt: true } },
        milestones: { select: { status: true } },
      },
    }),
  ]);

  const engagementsActive = contracts.filter((c) =>
    ["ACTIVE", "PAUSED"].includes(c.status)
  ).length;
  const engagementsCompleted = contracts.filter((c) => c.status === "COMPLETED").length;
  const goalsAchieved = contracts.filter((c) => c.outcome?.status === "VERIFIED").length;

  let actionItemsPending = 0;
  for (const c of contracts) {
    if (["ACTIVE", "PAUSED"].includes(c.status)) {
      const incomplete = c.milestones.filter((m) => m.status !== "COMPLETE").length;
      actionItemsPending += incomplete;
    }
  }

  const outcomes = contracts.map((c) => c.outcome).filter(Boolean) as Array<{
    status: string;
    checkInStatus: string;
    checkInDueAt: Date | null;
  }>;
  const checkinsCompleted = outcomes.filter((o) => o.checkInStatus === "COMPLETED").length;
  const now = new Date();
  const sixMonthCheckinDue = outcomes.some(
    (o) => o.checkInDueAt && o.checkInDueAt <= now && o.checkInStatus !== "COMPLETED" && o.checkInStatus !== "SKIPPED"
  );

  return {
    applicationsSubmitted: applications,
    engagementsCompleted,
    engagementsActive,
    goalsAchieved,
    actionItemsPending,
    sixMonthCheckinDue,
    checkinsCompleted,
  };
}
