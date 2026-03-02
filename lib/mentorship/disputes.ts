/**
 * M-9: Dispute Resolution Engine for Ascend mentorship.
 * Evidence assembled once, immutable. Ops cannot override auto-resolved.
 */

import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma/client";
import { logMentorshipAction } from "@/lib/mentorship/audit";
import { createOpsAlert } from "@/lib/mentorship/ops-alerts";
import { hasWaivedDisputeRights } from "@/lib/sessions/steno";
import { freezeTranche } from "@/lib/escrow";
import { unfreezeTrancheForDispute } from "@/lib/escrow";
import { recalculateDisputeRate } from "@/lib/mentorship/tiers";
import { runMonetisationUnlockCheck } from "@/lib/mentorship/monetisation";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { getMenteeStrikeCount as getStrikeCount } from "./dispute-strikes";
import type {
  DisputeCategory,
  DisputeOutcome,
  StrikeType,
} from "@prisma/client";

/** Filing window: completedAt + 7 days. */
export const DISPUTE_FILING_WINDOW_DAYS = 7;

/** Strike limits: 2 rejected = lose rights, 3 = OpsAlert. */
export const DISPUTE_RULES = {
  REJECTED_LOSE_RIGHTS: 2,
  REJECTED_OPS_ALERT: 3,
} as const;

/** Min session duration (minutes) for BELOW_MINIMUM_DURATION. */
export const MIN_SESSION_DURATION_MINS = 15;

/** Categories that require hasWaivedDisputeRights check; if waived → REJECTED_INVALID. */
export const WAIVER_REQUIRED_CATEGORIES: DisputeCategory[] = [
  "STENO_NOT_GENERATED",
  "COMMITMENTS_NOT_MET",
];

export async function validateDisputeFiling(
  contractId: string,
  milestoneId: string,
  filedByUserId: string,
  category: DisputeCategory
): Promise<{ valid: boolean; error?: string }> {
  const [contract, milestone, user] = await Promise.all([
    prisma.mentorshipContract.findUnique({
      where: { id: contractId },
      include: {
        mentee: { select: { id: true, canFileDisputes: true } },
        escrow: {
          include: {
            tranches: {
              where: { milestoneId },
              include: { disputes: { take: 1 } },
            },
          },
        },
      },
    }),
    prisma.engagementMilestone.findUnique({
      where: { id: milestoneId },
      include: {
        escrowTranche: true,
        contract: {
          include: {
            sessions: {
              where: { status: "COMPLETED" },
              orderBy: { sessionNumber: "asc" },
              select: { id: true },
            },
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: filedByUserId },
      select: { canFileDisputes: true },
    }),
  ]);

  if (!contract) return { valid: false, error: "Contract not found" };
  if (!milestone) return { valid: false, error: "Milestone not found" };
  if (!user?.canFileDisputes) {
    return { valid: false, error: "Dispute rights have been revoked" };
  }
  if (contract.menteeUserId !== filedByUserId) {
    return { valid: false, error: "Only mentee can file disputes" };
  }
  if (milestone.contractId !== contractId) {
    return { valid: false, error: "Milestone does not belong to contract" };
  }
  if (milestone.status !== "COMPLETE" && milestone.status !== "MENTOR_FILED") {
    return { valid: false, error: "Milestone must be filed by mentor (COMPLETE or MENTOR_FILED)" };
  }

  const completedAt = milestone.completedAt ?? milestone.mentorFiledAt;
  if (!completedAt) {
    return { valid: false, error: "Milestone has no completion date" };
  }
  const deadline = addDays(new Date(completedAt), DISPUTE_FILING_WINDOW_DAYS);
  if (new Date() > deadline) {
    return { valid: false, error: `Filing window closed (deadline: ${deadline.toISOString()})` };
  }

  const tranche = contract.escrow?.tranches?.[0];
  if (!tranche) return { valid: false, error: "No escrow tranche for this milestone" };
  if (tranche.status !== "PENDING_RELEASE") {
    return { valid: false, error: "Tranche must be in PENDING_RELEASE" };
  }
  if (tranche.disputes && tranche.disputes.length > 0) {
    return { valid: false, error: "One dispute per milestone" };
  }

  const strikeCount = await getStrikeCount(filedByUserId);
  if (strikeCount >= DISPUTE_RULES.REJECTED_LOSE_RIGHTS) {
    return { valid: false, error: "Dispute rights revoked due to previous rejected disputes" };
  }

  if (WAIVER_REQUIRED_CATEGORIES.includes(category)) {
    const sessionForMilestone = milestone.contract?.sessions?.[milestone.milestoneNumber - 1];
    if (sessionForMilestone) {
      const waived = await hasWaivedDisputeRights(sessionForMilestone.id, filedByUserId);
      if (waived) {
        return {
          valid: false,
          error: "You waived dispute rights for this category by not acknowledging Steno",
        };
      }
    }
  }

  return { valid: true };
}

/** Assemble evidence once, immutable. Called by evidence worker. */
export async function assembleEvidence(disputeId: string): Promise<void> {
  const dispute = await prisma.mentorshipDispute.findUnique({
    where: { id: disputeId },
    include: {
      milestone: {
        include: {
          contract: {
            include: {
              sessions: {
                where: { status: "COMPLETED" },
                orderBy: { sessionNumber: "asc" },
                include: {
                  stenoConsents: true,
                  transcripts: { orderBy: { createdAt: "desc" }, take: 1 },
                  stenoExtractions: { orderBy: { createdAt: "desc" }, take: 1 },
                },
              },
            },
          },
        },
      },
      evidence: true,
    },
  });
  if (!dispute) throw new Error("Dispute not found");
  if (dispute.evidence?.length) return;

  const contractId = dispute.contractId;
  const sessionForMilestone =
    dispute.milestone.contract?.sessions?.[dispute.milestone.milestoneNumber - 1];

  const evidenceItems: { evidenceType: string; content: object }[] = [];

  if (sessionForMilestone) {
    evidenceItems.push({
      evidenceType: "STENO_CONSENT",
      content: {
        sessionId: sessionForMilestone.id,
        consents: sessionForMilestone.stenoConsents.map((c) => ({
          userId: c.userId,
          participantType: c.participantType,
          acknowledged: c.acknowledged,
        })),
      },
    });
    const transcript = sessionForMilestone.transcripts?.[0];
    if (transcript) {
      evidenceItems.push({
        evidenceType: "TRANSCRIPT",
        content: { sessionId: sessionForMilestone.id, hasTranscript: true },
      });
    }
    const extraction = sessionForMilestone.stenoExtractions?.[0];
    if (extraction) {
      evidenceItems.push({
        evidenceType: "STENO_EXTRACTION",
        content: {
          mentorCommitments: extraction.mentorCommitments,
          menteeCommitments: extraction.menteeCommitments,
        },
      });
    }
    evidenceItems.push({
      evidenceType: "DURATION",
      content: {
        durationMinutes: sessionForMilestone.durationMinutes,
        effectiveDurationMins: sessionForMilestone.effectiveDurationMins,
        slotDurationMins: sessionForMilestone.slotDurationMins,
      },
    });
  }

  const messageFlags = await prisma.messageFlag.findMany({
    where: { contractId },
    select: { flagType: true, messageId: true },
  });
  evidenceItems.push({
    evidenceType: "MESSAGE_FLAGS",
    content: { flags: messageFlags },
  });

  const now = new Date();
  await prisma.$transaction([
    ...evidenceItems.map((e) =>
      prisma.disputeEvidence.create({
        data: {
          disputeId,
          evidenceType: e.evidenceType,
          content: e.content as object,
        },
      })
    ),
    prisma.mentorshipDispute.update({
      where: { id: disputeId },
      data: { status: "EVIDENCE_ASSEMBLED", evidenceAssembledAt: now },
    }),
  ]);

  await trackOutcome(dispute.filedByUserId, "M9_DISPUTE_EVIDENCE_ASSEMBLED", {
    entityId: disputeId,
    entityType: "MentorshipDispute",
    metadata: { category: dispute.category },
  });

  const { disputeAutoResolveQueue } = await import("@/lib/queues");
  await disputeAutoResolveQueue.add("resolve", { disputeId }, { delay: 10 * 60 * 1000 });
}

/** Per-category auto-resolve. Ops cannot override auto-resolved. */
export async function runAutoResolution(disputeId: string): Promise<DisputeOutcome | null> {
  const dispute = await prisma.mentorshipDispute.findUnique({
    where: { id: disputeId },
    include: {
      evidence: true,
      milestone: {
        include: {
          contract: {
            include: {
              sessions: {
                where: { status: "COMPLETED" },
                orderBy: { sessionNumber: "asc" },
              },
            },
          },
        },
      },
    },
  });
  if (!dispute) throw new Error("Dispute not found");
  if (dispute.status !== "EVIDENCE_ASSEMBLED") return null;

  let outcome: DisputeOutcome | null = null;
  switch (dispute.category) {
    case "SESSION_DID_NOT_HAPPEN":
      outcome = await resolveSessionDidNotHappen(dispute);
      break;
    case "BELOW_MINIMUM_DURATION":
      outcome = await resolveBelowMinimumDuration(dispute);
      break;
    case "STENO_NOT_GENERATED":
      outcome = await resolveStenoNotGenerated(dispute);
      break;
    case "OFF_PLATFORM_SOLICITATION":
      outcome = await resolveOffPlatformSolicitation(dispute);
      break;
    case "COMMITMENTS_NOT_MET":
      outcome = await resolveCommitmentsNotMet();
      break;
    default:
      outcome = null;
  }

  if (outcome) {
    const now = new Date();
    await prisma.mentorshipDispute.update({
      where: { id: disputeId },
      data: {
        status: "AUTO_RESOLVED",
        outcome,
        autoResolvedAt: now,
        resolvedAt: now,
      },
    });
    await trackOutcome(dispute.filedByUserId, "M9_DISPUTE_AUTO_RESOLVED", {
      entityId: disputeId,
      entityType: "MentorshipDispute",
      metadata: { category: dispute.category, outcome },
    });
  } else {
    await prisma.mentorshipDispute.update({
      where: { id: disputeId },
      data: { status: "PENDING_OPS" },
    });
  }
  return outcome;
}

async function resolveSessionDidNotHappen(dispute: {
  id: string;
  evidence: { evidenceType: string; content: unknown }[];
}): Promise<DisputeOutcome> {
  const durationEv = dispute.evidence.find((e) => e.evidenceType === "DURATION");
  const content = durationEv?.content as { durationMinutes?: number } | undefined;
  const duration = content?.durationMinutes ?? 0;
  return duration <= 0 ? "UPHELD" : "REJECTED";
}

async function resolveBelowMinimumDuration(dispute: {
  id: string;
  evidence: { evidenceType: string; content: unknown }[];
}): Promise<DisputeOutcome> {
  const durationEv = dispute.evidence.find((e) => e.evidenceType === "DURATION");
  const content = durationEv?.content as {
    durationMinutes?: number;
    effectiveDurationMins?: number;
  } | undefined;
  const mins = content?.effectiveDurationMins ?? content?.durationMinutes ?? 0;
  return mins < MIN_SESSION_DURATION_MINS ? "UPHELD" : "REJECTED";
}

async function resolveStenoNotGenerated(dispute: {
  id: string;
  evidence: { evidenceType: string; content: unknown }[];
}): Promise<DisputeOutcome> {
  const transcriptEv = dispute.evidence.find((e) => e.evidenceType === "TRANSCRIPT");
  const hasTranscript = (transcriptEv?.content as { hasTranscript?: boolean })?.hasTranscript;
  return !hasTranscript ? "UPHELD" : "REJECTED";
}

async function resolveOffPlatformSolicitation(dispute: {
  id: string;
  evidence: { evidenceType: string; content: unknown }[];
}): Promise<DisputeOutcome | null> {
  const flagsEv = dispute.evidence.find((e) => e.evidenceType === "MESSAGE_FLAGS");
  const flags = (flagsEv?.content as { flags?: { flagType: string }[] })?.flags ?? [];
  const hasPaySolicitation = flags.some(
    (f) => f.flagType === "PAYMENT_SOLICITATION" || f.flagType === "EXTERNAL_EMAIL"
  );
  return hasPaySolicitation ? "UPHELD" : null;
}

async function resolveCommitmentsNotMet(): Promise<DisputeOutcome | null> {
  return null;
}

/** Apply resolution outcome: unfreeze/refund, strikes, runMonetisationUnlockCheck, recalculateDisputeRate. */
export async function applyResolutionOutcome(
  disputeId: string,
  outcome: DisputeOutcome
): Promise<void> {
  const dispute = await prisma.mentorshipDispute.findUnique({
    where: { id: disputeId },
    include: {
      contract: { select: { mentorUserId: true, menteeUserId: true } },
      tranche: true,
    },
  });
  if (!dispute) throw new Error("Dispute not found");
  if (dispute.status === "RESOLVED") return;

  const trancheId = dispute.trancheId;
  const mentorId = dispute.contract.mentorUserId;
  const menteeId = dispute.contract.menteeUserId;

  await unfreezeTrancheForDispute(
    trancheId,
    outcome === "UPHELD" ? "UPHELD" : "REJECTED"
  );

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const engagementUrl = `${baseUrl}/mentorship/engagements/${dispute.contractId}`;
  const [menteeUser, mentorUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: menteeId }, select: { email: true, name: true } }),
    prisma.user.findUnique({ where: { id: mentorId }, select: { email: true, name: true } }),
  ]);
  const amountRupees = (dispute.tranche.amountPaise / 100).toFixed(2);

  if (outcome === "UPHELD") {
    await prisma.disputeStrike.create({
      data: {
        disputeId,
        userId: mentorId,
        strikeType: "MENTOR_DISPUTE_UPHELD",
      },
    });
    await enforceStrikeConsequences(mentorId, "MENTOR_DISPUTE_UPHELD");
    await trackOutcome(menteeId, "M9_DISPUTE_UPHELD", {
      entityId: disputeId,
      entityType: "MentorshipDispute",
      metadata: { category: dispute.category },
    });
    const { sendDisputeUpheld } = await import("@/lib/email/templates/mentorship/dispute-upheld");
    const { sendDisputeMentorUpheld } = await import("@/lib/email/templates/mentorship/dispute-mentor-upheld");
    if (menteeUser?.email) {
      sendDisputeUpheld({ to: menteeUser.email, menteeName: menteeUser.name ?? "there", amountRupees, engagementUrl }).catch(() => {});
    }
    if (mentorUser?.email) {
      sendDisputeMentorUpheld({ to: mentorUser.email, mentorName: mentorUser.name ?? "Mentor", amountRupees, engagementUrl }).catch(() => {});
    }
  } else if (outcome === "REJECTED" || outcome === "REJECTED_INVALID") {
    await prisma.disputeStrike.create({
      data: {
        disputeId,
        userId: menteeId,
        strikeType: "MENTEE_DISPUTE_REJECTED",
      },
    });
    await enforceStrikeConsequences(menteeId, "MENTEE_DISPUTE_REJECTED");
    await trackOutcome(menteeId, outcome === "REJECTED" ? "M9_DISPUTE_REJECTED" : "M9_DISPUTE_REJECTED_INVALID", {
      entityId: disputeId,
      entityType: "MentorshipDispute",
      metadata: { category: dispute.category },
    });
    const { sendDisputeRejected } = await import("@/lib/email/templates/mentorship/dispute-rejected");
    const { sendDisputeRejectedInvalid } = await import("@/lib/email/templates/mentorship/dispute-rejected-invalid");
    const { sendDisputeMentorRejected } = await import("@/lib/email/templates/mentorship/dispute-mentor-rejected");
    if (menteeUser?.email) {
      (outcome === "REJECTED"
        ? sendDisputeRejected({ to: menteeUser.email, menteeName: menteeUser.name ?? "there", amountRupees, engagementUrl })
        : sendDisputeRejectedInvalid({ to: menteeUser.email, menteeName: menteeUser.name ?? "there", reason: "Invalid or waived rights", engagementUrl })
      ).catch(() => {});
    }
    if (mentorUser?.email) {
      sendDisputeMentorRejected({ to: mentorUser.email, mentorName: mentorUser.name ?? "Mentor", amountRupees, engagementUrl }).catch(() => {});
    }
  }

  const now = new Date();
  await prisma.mentorshipDispute.update({
    where: { id: disputeId },
    data: {
      status: "RESOLVED",
      outcome,
      opsReason: outcome === "UPHELD" ? "UPHELD" : outcome === "REJECTED_INVALID" ? "REJECTED_INVALID" : "REJECTED",
      resolvedAt: now,
    },
  });

  await recalculateDisputeRate(mentorId);
  await runMonetisationUnlockCheck(mentorId);

  await logMentorshipAction({
    actorId: "SYSTEM",
    action: "DISPUTE_RESOLVED",
    category: "DISPUTE",
    entityType: "MentorshipDispute",
    entityId: disputeId,
    newState: { outcome },
  }).catch(() => {});
}

export { getMenteeStrikeCount } from "./dispute-strikes";

export async function enforceStrikeConsequences(
  userId: string,
  strikeType: StrikeType
): Promise<void> {
  if (strikeType === "MENTEE_DISPUTE_REJECTED") {
    const count = await getStrikeCount(userId);
    if (count >= DISPUTE_RULES.REJECTED_LOSE_RIGHTS) {
      await prisma.user.update({
        where: { id: userId },
        data: { canFileDisputes: false },
      });
      await trackOutcome(userId, "M9_CAN_FILE_DISPUTES_REVOKED", {
        entityId: userId,
        entityType: "User",
        metadata: { strikeCount: count },
      });
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
      if (user?.email) {
        const baseUrl = process.env.NEXTAUTH_URL ?? "";
        const { sendDisputeRightsRevoked } = await import("@/lib/email/templates/mentorship/dispute-rights-revoked");
        sendDisputeRightsRevoked({
          to: user.email,
          menteeName: user.name ?? "there",
          dashboardUrl: `${baseUrl}/mentorship/dashboard`,
        }).catch(() => {});
      }
    }
    if (count >= DISPUTE_RULES.REJECTED_OPS_ALERT) {
      await createOpsAlert(
        "MENTEE_3_STRIKES",
        "User",
        userId,
        `Mentee has ${count} rejected dispute strikes`,
        "HIGH"
      );
    }
  }
  await trackOutcome(userId, "M9_STRIKE_APPLIED", {
    entityId: userId,
    entityType: "User",
    metadata: { strikeType },
  });
}

/** Create dispute, freeze tranche, queue evidence. */
export async function fileDispute(params: {
  contractId: string;
  milestoneId: string;
  filedByUserId: string;
  category: DisputeCategory;
  description: string;
}): Promise<{ disputeId: string }> {
  const validation = await validateDisputeFiling(
    params.contractId,
    params.milestoneId,
    params.filedByUserId,
    params.category
  );
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const milestone = await prisma.engagementMilestone.findUnique({
    where: { id: params.milestoneId },
    include: { escrowTranche: true },
  });
  if (!milestone?.escrowTranche) throw new Error("Tranche not found");

  const trancheId = milestone.escrowTranche.id;
  await freezeTranche(trancheId, params.filedByUserId, params.description);

  const dispute = await prisma.mentorshipDispute.create({
    data: {
      contractId: params.contractId,
      milestoneId: params.milestoneId,
      trancheId,
      filedByUserId: params.filedByUserId,
      category: params.category,
      description: params.description,
      status: "PENDING_EVIDENCE",
    },
  });

  const { disputeEvidenceQueue } = await import("@/lib/queues");
  await disputeEvidenceQueue.add("assemble", { disputeId: dispute.id });

  await trackOutcome(params.filedByUserId, "M9_DISPUTE_FILED", {
    entityId: dispute.id,
    entityType: "MentorshipDispute",
    metadata: { category: params.category },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const [mentee, mentor] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.filedByUserId },
      select: { email: true, name: true },
    }),
    prisma.mentorshipContract.findUnique({
      where: { id: params.contractId },
      select: { mentorUserId: true },
    }).then(async (c) =>
      c ? prisma.user.findUnique({
        where: { id: c.mentorUserId },
        select: { email: true, name: true },
      }) : null
    ),
  ]);
  const amountRupees = (await prisma.escrowTranche.findUnique({
    where: { id: trancheId },
    select: { amountPaise: true },
  }))?.amountPaise ?? 0;
  const { sendDisputeFiledMentee } = await import("@/lib/email/templates/mentorship/dispute-filed-mentee");
  const { sendDisputeFiledMentor } = await import("@/lib/email/templates/mentorship/dispute-filed-mentor");
  if (mentee?.email) {
    sendDisputeFiledMentee({
      to: mentee.email,
      menteeName: mentee.name ?? "there",
      category: params.category,
      disputeUrl: `${baseUrl}/mentorship/engagements/${params.contractId}/disputes/${dispute.id}`,
    }).catch(() => {});
  }
  if (mentor?.email) {
    sendDisputeFiledMentor({
      to: mentor.email,
      mentorName: mentor.name ?? "Mentor",
      category: params.category,
      amountRupees: (amountRupees / 100).toFixed(2),
      engagementUrl: `${baseUrl}/mentorship/engagements/${params.contractId}`,
    }).catch(() => {});
  }

  return { disputeId: dispute.id };
}
