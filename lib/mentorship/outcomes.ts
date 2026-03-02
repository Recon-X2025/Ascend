/**
 * M-10: Outcome verification & attribution.
 * Submit claim, verify/dispute, ops review, 6-month check-in, mentor stats.
 */

import type { MentorshipOutcome } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { addDays, addMonths, differenceInDays } from "date-fns";

const CHECKIN_MONTHS = 6;
const ACKNOWLEDGEMENT_DAYS = 7;
const MAX_OUTCOME_TYPES = 10;

export interface SubmitOutcomeClaimData {
  outcomeAchieved: boolean;
  transitionType: string;
  claimedOutcome: string;
  mentorReflection?: string;
  testimonialConsent: boolean;
}

export async function submitOutcomeClaim(
  contractId: string,
  mentorId: string,
  data: SubmitOutcomeClaimData
): Promise<MentorshipOutcome> {
  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
    include: {
      outcome: true,
      mentor: { select: { email: true, name: true } },
      mentee: { select: { email: true, name: true } },
      milestones: true,
    },
  });
  if (!contract) throw new Error("Contract not found");
  if (contract.mentorUserId !== mentorId) throw new Error("Forbidden");
  if (contract.status !== "ACTIVE") throw new Error("Contract must be ACTIVE");
  const finalMilestone = contract.milestones.find((m) => m.type === "FINAL");
  const finalComplete = finalMilestone?.status === "COMPLETE";
  const engagementEndPassed = contract.engagementEnd && new Date() >= contract.engagementEnd;
  if (!engagementEndPassed && !finalComplete) {
    throw new Error("Engagement end date must have passed or FINAL milestone complete");
  }
  if (contract.outcome) throw new Error("Outcome already submitted for this contract");

  const deadline = addDays(new Date(), ACKNOWLEDGEMENT_DAYS);
  const outcome = await prisma.mentorshipOutcome.create({
    data: {
      contractId,
      mentorId: contract.mentorUserId,
      menteeId: contract.menteeUserId,
      outcomeAchieved: data.outcomeAchieved,
      transitionType: data.transitionType.slice(0, 100),
      claimedOutcome: data.claimedOutcome.slice(0, 500),
      mentorReflection: data.mentorReflection?.slice(0, 500) ?? null,
      testimonialConsent: data.testimonialConsent,
      status: "PENDING_MENTEE",
      acknowledgementDeadline: deadline,
    },
  });

  const { outcomeAcknowledgementQueue } = await import("@/lib/queues");
  await outcomeAcknowledgementQueue.add("expiry", { outcomeId: outcome.id }, { delay: ACKNOWLEDGEMENT_DAYS * 24 * 60 * 60 * 1000 });

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const { sendOutcomeSubmitted } = await import("@/lib/email/templates/mentorship/outcome-submitted");
  await sendOutcomeSubmitted({
    to: contract.mentee.email!,
    menteeName: contract.mentee.name ?? "Mentee",
    mentorName: contract.mentor.name ?? "Mentor",
    transitionType: data.transitionType,
    deadline,
    outcomeUrl: `${baseUrl}/mentorship/engagements/${contractId}`,
  });

  const { logMentorshipAction } = await import("@/lib/mentorship/audit");
  await logMentorshipAction({
    actorId: mentorId,
    action: "OUTCOME_SUBMITTED",
    category: "OUTCOME",
    entityType: "MentorshipOutcome",
    entityId: outcome.id,
    newState: { status: "PENDING_MENTEE", acknowledgementDeadline: deadline.toISOString() },
  });

  await trackOutcome(mentorId, "M10_OUTCOME_SUBMITTED", {
    entityId: contractId,
    entityType: "MentorshipContract",
    metadata: { contractId, mentorId, menteeId: contract.menteeUserId, outcomeAchieved: data.outcomeAchieved },
  });

  return outcome;
}

export async function verifyOutcome(
  outcomeId: string,
  menteeId: string,
  note?: string
): Promise<MentorshipOutcome> {
  const outcome = await prisma.mentorshipOutcome.findUnique({
    where: { id: outcomeId },
    include: { mentor: { select: { email: true, name: true } }, mentee: { select: { email: true, name: true } } },
  });
  if (!outcome) throw new Error("Outcome not found");
  if (outcome.menteeId !== menteeId) throw new Error("Forbidden");
  if (outcome.status !== "PENDING_MENTEE") throw new Error("Outcome is not pending mentee verification");

  const now = new Date();
  const updated = await prisma.mentorshipOutcome.update({
    where: { id: outcomeId },
    data: { status: "VERIFIED", menteeConfirmedAt: now, menteeNote: note ?? null },
  });

  const { logMentorshipAction } = await import("@/lib/mentorship/audit");
  await logMentorshipAction({
    actorId: menteeId,
    action: "OUTCOME_VERIFIED",
    category: "OUTCOME",
    entityType: "MentorshipOutcome",
    entityId: outcomeId,
    newState: { status: "VERIFIED", menteeConfirmedAt: now.toISOString() },
  });

  await recalculateMentorOutcomeStats(outcome.mentorId);
  const { recalculateMentorTier } = await import("@/lib/mentorship/tiers");
  await recalculateMentorTier(outcome.mentorId, "OUTCOME_VERIFIED");

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const { sendOutcomeVerified } = await import("@/lib/email/templates/mentorship/outcome-verified");
  await sendOutcomeVerified({
    to: outcome.mentor.email,
    mentorName: outcome.mentor.name ?? "Mentor",
    menteeName: outcome.mentee.name ?? "Mentee",
    transitionType: outcome.transitionType,
    engagementUrl: `${baseUrl}/mentorship/engagements/${outcome.contractId}`,
  });

  if (outcome.testimonialConsent) {
    const opsEmail = process.env.OPS_EMAIL;
    if (opsEmail) {
      const { sendTestimonialConsentConfirmed } = await import("@/lib/email/templates/mentorship/testimonial-consent-confirmed");
      await sendTestimonialConsentConfirmed({
        to: opsEmail,
        mentorName: outcome.mentor.name ?? "Mentor",
        transitionType: outcome.transitionType,
        outcomeId,
      });
    }
  }

  const { outcomeCheckinQueue } = await import("@/lib/queues");
  const checkInDueAt = addMonths(now, CHECKIN_MONTHS);
  await prisma.mentorshipOutcome.update({
    where: { id: outcomeId },
    data: { checkInDueAt },
  });
  await outcomeCheckinQueue.add("reminder", { outcomeId }, { delay: CHECKIN_MONTHS * 30 * 24 * 60 * 60 * 1000 });

  await trackOutcome(menteeId, "M10_OUTCOME_VERIFIED", {
    entityId: outcomeId,
    entityType: "MentorshipOutcome",
    metadata: { outcomeId, contractId: outcome.contractId, mentorId: outcome.mentorId, menteeId },
  });

  return updated;
}

export async function disputeOutcome(
  outcomeId: string,
  menteeId: string,
  note: string
): Promise<MentorshipOutcome> {
  const outcome = await prisma.mentorshipOutcome.findUnique({
    where: { id: outcomeId },
    include: { mentor: { select: { email: true, name: true } }, mentee: { select: { email: true, name: true } } },
  });
  if (!outcome) throw new Error("Outcome not found");
  if (outcome.menteeId !== menteeId) throw new Error("Forbidden");
  if (outcome.status !== "PENDING_MENTEE") throw new Error("Outcome is not pending mentee verification");
  if (!note || note.trim().length < 20) throw new Error("Dispute note must be at least 20 characters");

  const now = new Date();
  const updated = await prisma.mentorshipOutcome.update({
    where: { id: outcomeId },
    data: { status: "DISPUTED", menteeDisputedAt: now, menteeNote: note.trim() },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const { sendOutcomeDisputed } = await import("@/lib/email/templates/mentorship/outcome-disputed");
  const disputeParams = {
    to: outcome.mentor.email,
    mentorName: outcome.mentor.name ?? "Mentor",
    menteeName: outcome.mentee.name ?? "Mentee",
    transitionType: outcome.transitionType,
    menteeNote: note.trim(),
    outcomeId,
    engagementUrl: `${baseUrl}/mentorship/engagements/${outcome.contractId}`,
  };
  await sendOutcomeDisputed(disputeParams);

  const opsEmail = process.env.OPS_EMAIL;
  if (opsEmail) {
    await sendOutcomeDisputed({
      ...disputeParams,
      to: opsEmail,
      mentorName: "Ops",
      engagementUrl: `${baseUrl}/dashboard/admin/mentorship/outcomes`,
    });
  }

  const { logMentorshipAction } = await import("@/lib/mentorship/audit");
  await logMentorshipAction({
    actorId: menteeId,
    action: "OUTCOME_DISPUTED",
    category: "OUTCOME",
    entityType: "MentorshipOutcome",
    entityId: outcomeId,
    newState: { status: "DISPUTED", menteeDisputedAt: now.toISOString() },
    reason: note.trim().slice(0, 500),
  });

  await trackOutcome(menteeId, "M10_OUTCOME_DISPUTED", {
    entityId: outcomeId,
    entityType: "MentorshipOutcome",
    metadata: { outcomeId, contractId: outcome.contractId },
  });

  return updated;
}

export async function markUnacknowledged(outcomeId: string): Promise<void> {
  const outcome = await prisma.mentorshipOutcome.findUnique({
    where: { id: outcomeId },
    include: { mentor: { select: { email: true, name: true } }, mentee: { select: { email: true, name: true } } },
  });
  if (!outcome) return;
  if (outcome.status !== "PENDING_MENTEE") return;

  await prisma.mentorshipOutcome.update({
    where: { id: outcomeId },
    data: { status: "UNACKNOWLEDGED" },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const { sendOutcomeUnacknowledged } = await import("@/lib/email/templates/mentorship/outcome-unacknowledged");
  await sendOutcomeUnacknowledged({
    mentorEmail: outcome.mentor.email,
    menteeEmail: outcome.mentee.email,
    mentorName: outcome.mentor.name ?? "Mentor",
    menteeName: outcome.mentee.name ?? "Mentee",
    transitionType: outcome.transitionType,
    outcomeUrl: `${baseUrl}/mentorship/engagements/${outcome.contractId}`,
  });

  await trackOutcome(outcome.mentorId, "M10_OUTCOME_UNACKNOWLEDGED", {
    entityId: outcomeId,
    entityType: "MentorshipOutcome",
    metadata: { outcomeId, contractId: outcome.contractId },
  });
}

export async function opsReviewOutcome(
  outcomeId: string,
  adminId: string,
  decision: "UPHELD" | "OVERTURNED",
  note: string
): Promise<MentorshipOutcome> {
  const outcome = await prisma.mentorshipOutcome.findUnique({
    where: { id: outcomeId },
    include: { mentor: { select: { email: true, name: true } }, mentee: { select: { email: true, name: true } } },
  });
  if (!outcome) throw new Error("Outcome not found");
  if (outcome.status !== "DISPUTED") throw new Error("Outcome is not disputed");

  const now = new Date();
  const updated = await prisma.mentorshipOutcome.update({
    where: { id: outcomeId },
    data: {
      status: "OPS_REVIEWED",
      opsReviewedAt: now,
      opsReviewedBy: adminId,
      opsDecision: decision,
      opsNote: note,
    },
  });

  if (decision === "UPHELD") {
    await recalculateMentorOutcomeStats(outcome.mentorId);
    const { recalculateDisputeRate, recalculateMentorTier } = await import("@/lib/mentorship/tiers");
    await recalculateDisputeRate(outcome.mentorId);
    await recalculateMentorTier(outcome.mentorId, "WEEKLY_CALC");
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const { sendOpsReviewComplete } = await import("@/lib/email/templates/mentorship/ops-review-complete");
  await sendOpsReviewComplete({
    mentorEmail: outcome.mentor.email,
    menteeEmail: outcome.mentee.email,
    mentorName: outcome.mentor.name ?? "Mentor",
    menteeName: outcome.mentee.name ?? "Mentee",
    decision,
    opsNote: note,
    outcomeUrl: `${baseUrl}/mentorship/engagements/${outcome.contractId}`,
  });

  const { logMentorshipAction } = await import("@/lib/mentorship/audit");
  await logMentorshipAction({
    actorId: adminId,
    action: "OUTCOME_OPS_REVIEWED",
    category: "OUTCOME",
    entityType: "MentorshipOutcome",
    entityId: outcomeId,
    newState: { status: "OPS_REVIEWED", opsDecision: decision },
    reason: note,
  });

  const { logAudit } = await import("@/lib/audit/log");
  await logAudit({
    actorId: adminId,
    category: "ADMIN_ACTION",
    action: "OPS_OUTCOME_REVIEW",
    targetType: "MentorshipOutcome",
    targetId: outcomeId,
    metadata: { outcomeId, decision, contractId: outcome.contractId },
  });

  await trackOutcome(adminId, "M10_OUTCOME_OPS_REVIEWED", {
    entityId: outcomeId,
    entityType: "MentorshipOutcome",
    metadata: { outcomeId, decision, contractId: outcome.contractId },
  });

  return updated;
}

export async function submitCheckIn(
  outcomeId: string,
  menteeId: string,
  note: string
): Promise<MentorshipOutcome> {
  const outcome = await prisma.mentorshipOutcome.findUnique({
    where: { id: outcomeId },
    include: { mentor: { select: { email: true, name: true } } },
  });
  if (!outcome) throw new Error("Outcome not found");
  if (outcome.menteeId !== menteeId) throw new Error("Forbidden");
  if (outcome.checkInStatus !== "PENDING") throw new Error("Check-in already completed or skipped");
  if (outcome.status !== "VERIFIED") throw new Error("Outcome must be verified");
  if (!outcome.checkInDueAt || new Date() < outcome.checkInDueAt) {
    throw new Error("6-month check-in is not yet due");
  }

  const now = new Date();
  const updated = await prisma.mentorshipOutcome.update({
    where: { id: outcomeId },
    data: {
      checkInStatus: "COMPLETED",
      checkInCompletedAt: now,
      checkInNote: note.trim(),
      checkInBadgeGranted: true,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const { sendCheckinCompleted } = await import("@/lib/email/templates/mentorship/checkin-completed");
  await sendCheckinCompleted({
    to: outcome.mentor.email,
    mentorName: outcome.mentor.name ?? "Mentor",
    menteeNote: note.trim(),
    transitionType: outcome.transitionType,
    outcomeUrl: `${baseUrl}/mentorship/engagements/${outcome.contractId}`,
  });

  await trackOutcome(menteeId, "M10_CHECKIN_SUBMITTED", {
    entityId: outcomeId,
    entityType: "MentorshipOutcome",
    metadata: { outcomeId, contractId: outcome.contractId, menteeId },
  });

  return updated;
}

/** Idempotent: recomputes from scratch. */
export async function recalculateMentorOutcomeStats(mentorId: string): Promise<void> {
  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: mentorId },
  });
  if (!mentorProfile) return;

  const outcomes = await prisma.mentorshipOutcome.findMany({
    where: { mentorId, status: "VERIFIED" },
    include: { contract: { select: { engagementStart: true } } },
  });

  const allOutcomes = await prisma.mentorshipOutcome.findMany({
    where: { mentorId },
  });

  const verifiedCount = outcomes.length;
  const totalEngagements = allOutcomes.length;

  let avgTimeToOutcomeDays: number | null = null;
  const daysList = outcomes
    .filter((o) => o.menteeConfirmedAt && o.contract.engagementStart)
    .map((o) => differenceInDays(o.menteeConfirmedAt!, o.contract.engagementStart!));
  if (daysList.length > 0) {
    avgTimeToOutcomeDays = daysList.reduce((a, b) => a + b, 0) / daysList.length;
  }

  const typeSet = new Set<string>();
  for (const o of outcomes) {
    typeSet.add(o.transitionType);
    if (typeSet.size >= MAX_OUTCOME_TYPES) break;
  }
  const outcomeTypes = Array.from(typeSet);

  await prisma.mentorProfile.update({
    where: { id: mentorProfile.id },
    data: {
      verifiedOutcomeCount: verifiedCount,
      totalEngagements,
      avgTimeToOutcomeDays: avgTimeToOutcomeDays ?? undefined,
      outcomeTypes,
    },
  });
}
