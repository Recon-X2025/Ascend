/**
 * M-16: Ops alerts — create (idempotent), resolve, and daily checks.
 */

import { prisma } from "@/lib/prisma/client";
import { logMentorshipAction } from "@/lib/mentorship/audit";
import type { OpsAlertType } from "@prisma/client";
import { subDays, differenceInBusinessDays } from "date-fns";

const VERIFICATION_SLA_HOURS = 48;
const CONTRACT_SIGN_DEADLINE_HOURS = 48;
const DISPUTE_SLA_BUSINESS_DAYS = 5;
const REVERIFICATION_LAPSE_DAYS = 30;
const ENGAGEMENT_STALLED_DAYS = 14;

export type { OpsAlertType };

export async function createOpsAlert(
  type: OpsAlertType,
  entityType: string,
  entityId: string,
  message: string,
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
): Promise<void> {
  const existing = await prisma.opsAlert.findFirst({
    where: { type, entityId, resolvedAt: null },
  });
  if (existing) return;

  await prisma.opsAlert.create({
    data: { type, entityType, entityId, message, severity },
  });

  const { trackOutcome } = await import("@/lib/tracking/outcomes");
  const systemUserId = process.env.M16_SYSTEM_ACTOR_ID;
  if (systemUserId) {
    await trackOutcome(systemUserId, "M16_OPS_ALERT_CREATED", {
      entityId,
      entityType,
      metadata: { alertType: type, severity },
    });
  }
}

export async function resolveOpsAlert(alertId: string, resolvedById: string): Promise<void> {
  const alert = await prisma.opsAlert.findUnique({ where: { id: alertId } });
  if (!alert) return;
  if (alert.resolvedAt) return;

  const now = new Date();
  await prisma.opsAlert.update({
    where: { id: alertId },
    data: { resolvedAt: now, resolvedById },
  });

  await logMentorshipAction({
    actorId: resolvedById,
    action: "OPS_ALERT_RESOLVED",
    category: "SYSTEM",
    entityType: "OpsAlert",
    entityId: alertId,
    newState: { resolvedAt: now.toISOString(), resolvedById },
    reason: "Resolved by ops",
  });

  const { trackOutcome } = await import("@/lib/tracking/outcomes");
  await trackOutcome(resolvedById, "M16_OPS_ALERT_RESOLVED", {
    entityId: alertId,
    entityType: "OpsAlert",
    metadata: { alertType: alert.type },
  });
}

/** Business days between two dates (exclusive of end). */
function businessDaysBetween(from: Date, to: Date): number {
  return Math.max(0, differenceInBusinessDays(to, from));
}

export async function checkAndCreateAlerts(): Promise<{ created: number; criticalCount: number; highCount: number }> {
  const now = new Date();
  let created = 0;
  const criticalCount = 0;
  let highCount = 0;

  // 1. Verification SLA: PENDING and createdAt < now - 48h
  const verification48h = subDays(now, VERIFICATION_SLA_HOURS / 24);
  const pendingVerifications = await prisma.mentorVerification.findMany({
    where: { status: "PENDING", createdAt: { lt: verification48h } },
    include: { mentorProfile: { include: { user: { select: { id: true, name: true } } } } },
  });
  for (const v of pendingVerifications) {
    await createOpsAlert(
      "VERIFICATION_SLA_BREACH",
      "MentorVerification",
      v.id,
      `Verification pending > ${VERIFICATION_SLA_HOURS}h for ${v.mentorProfile.user?.name ?? v.mentorProfileId}`,
      "HIGH"
    );
    created++;
    highCount++;
  }

  // 2. Contract unsigned: PENDING_*_SIGNATURE and createdAt < now - 48h
  const contract48h = subDays(now, CONTRACT_SIGN_DEADLINE_HOURS / 24);
  const pendingContracts = await prisma.mentorshipContract.findMany({
    where: {
      status: { in: ["PENDING_MENTOR_SIGNATURE", "PENDING_MENTEE_SIGNATURE"] },
      createdAt: { lt: contract48h },
    },
  });
  for (const c of pendingContracts) {
    await createOpsAlert(
      "CONTRACT_UNSIGNED",
      "MentorshipContract",
      c.id,
      `Contract ${c.id} pending signature > ${CONTRACT_SIGN_DEADLINE_HOURS}h`,
      "MEDIUM"
    );
    created++;
  }

  // 3. Dispute SLA: Outcome DISPUTED and updatedAt > 5 business days ago
  const disputedOutcomes = await prisma.mentorshipOutcome.findMany({
    where: { status: "DISPUTED" },
    select: { id: true, updatedAt: true, contractId: true },
  });
  for (const o of disputedOutcomes) {
    const days = businessDaysBetween(o.updatedAt, now);
    if (days >= DISPUTE_SLA_BUSINESS_DAYS) {
      await createOpsAlert(
        "DISPUTE_SLA_BREACH",
        "MentorshipOutcome",
        o.id,
        `Outcome ${o.id} disputed > ${DISPUTE_SLA_BUSINESS_DAYS} business days`,
        "HIGH"
      );
      created++;
      highCount++;
    }
  }

  // 4. Outcome unacknowledged: PENDING_MENTEE and acknowledgementDeadline < now
  const unackOutcomes = await prisma.mentorshipOutcome.findMany({
    where: { status: "PENDING_MENTEE", acknowledgementDeadline: { lt: now } },
    select: { id: true },
  });
  for (const o of unackOutcomes) {
    await createOpsAlert(
      "OUTCOME_UNACKNOWLEDGED",
      "MentorshipOutcome",
      o.id,
      `Outcome ${o.id} not acknowledged by mentee before deadline`,
      "MEDIUM"
    );
    created++;
  }

  // 5. Mentor high dispute rate > 25%
  const mentors = await prisma.mentorProfile.findMany({
    where: { disputeRate: { gt: 0.25 } },
    select: { id: true, userId: true, disputeRate: true, user: { select: { name: true } } },
  });
  for (const m of mentors) {
    await createOpsAlert(
      "MENTOR_HIGH_DISPUTE_RATE",
      "MentorProfile",
      m.id,
      `Mentor ${m.user?.name ?? m.userId} dispute rate ${((m.disputeRate ?? 0) * 100).toFixed(0)}%`,
      "HIGH"
    );
    created++;
    highCount++;
  }

  // 6. Mentor lapsed reverification: REVERIFICATION_REQUIRED and updatedAt > 30 days
  const reverify30d = subDays(now, REVERIFICATION_LAPSE_DAYS);
  const lapsed = await prisma.mentorProfile.findMany({
    where: { verificationStatus: "REVERIFICATION_REQUIRED", updatedAt: { lt: reverify30d } },
    select: { id: true, userId: true, user: { select: { name: true } } },
  });
  for (const m of lapsed) {
    await createOpsAlert(
      "MENTOR_LAPSED_REVERIFICATION",
      "MentorProfile",
      m.id,
      `Mentor ${m.user?.name ?? m.userId} reverification overdue > ${REVERIFICATION_LAPSE_DAYS} days`,
      "MEDIUM"
    );
    created++;
  }

  // 7. Engagement stalled: ACTIVE contract with no session in last 14 days (exclude PAUSED)
  const stalledCutoff = subDays(now, ENGAGEMENT_STALLED_DAYS);
  const activeContracts = await prisma.mentorshipContract.findMany({
    where: { status: "ACTIVE" },
    include: {
      sessions: {
        where: { completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        take: 1,
        select: { completedAt: true },
      },
    },
  });
  for (const c of activeContracts) {
    const lastSession = c.sessions[0]?.completedAt;
    if (!lastSession || lastSession < stalledCutoff) {
      await createOpsAlert(
        "ENGAGEMENT_STALLED",
        "MentorshipContract",
        c.id,
        `Contract ${c.id} active with no completed session in ${ENGAGEMENT_STALLED_DAYS} days`,
        "MEDIUM"
      );
      created++;
    }
  }

  // 8. STENO_FAILURE — M-7 stub: commented out
  // M-7: wire when Steno is live

  // 9. M-9: Escrow disputes PENDING_OPS > 5 business days
  const disputedEscrow = await prisma.mentorshipDispute.findMany({
    where: { status: "PENDING_OPS" },
    select: { id: true, createdAt: true, contractId: true },
  });
  for (const d of disputedEscrow) {
    const days = businessDaysBetween(d.createdAt, now);
    if (days >= DISPUTE_SLA_BUSINESS_DAYS) {
      await createOpsAlert(
        "ESCROW_DISPUTE_SLA_BREACH",
        "MentorshipDispute",
        d.id,
        `Escrow dispute ${d.id} PENDING_OPS > ${DISPUTE_SLA_BUSINESS_DAYS} business days`,
        "HIGH"
      );
      created++;
      highCount++;
    }
  }

  return { created, criticalCount, highCount };
}
