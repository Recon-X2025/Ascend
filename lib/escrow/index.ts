/**
 * M-6: Mentorship Escrow & Payment Infrastructure.
 * Zero Trust: no money moves without evidence.
 */

import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma/client";
import { logMentorshipAction } from "@/lib/mentorship/audit";
import { createOrder } from "@/lib/payments";
import { getMentorActivePlan } from "@/lib/payments/plans";
import { calculateTranches, getFeeRate } from "./tranches";
import {
  getLiveFeeRate,
  calculateFeeAmounts,
  hasTierChanged,
} from "./fees";
import { DEFAULT_ESCROW_FEE_PAISE, AUTO_RELEASE_DAYS } from "./config";
import {
  transferToMentor,
  refundToMentee,
} from "./route-stub";
import type { MovementType, PaymentReasonCode, PaymentMode } from "@prisma/client";

/** Create escrow record + Razorpay order. Mentee pays to fund. */
export async function createEscrowOrder(
  contractId: string,
  paymentMode: PaymentMode = "ESCROW"
): Promise<{
  escrowId: string;
  orderId: string;
  amount: number;
  currency: string;
} | { error: string; message: string }> {
  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
    include: {
      mentor: {
        include: {
          mentorProfile: {
            select: { tier: true, canChargeMentees: true },
          },
        },
      },
      mentee: { select: { id: true } },
    },
  });
  if (!contract) throw new Error("Contract not found");
  if (contract.status !== "ACTIVE") {
    throw new Error("Escrow can only be created when contract is ACTIVE (both parties signed)");
  }

  // M-13: canChargeMentees requires BOTH isUnlocked AND MENTOR_MARKETPLACE plan
  const mentorProfile = contract.mentor?.mentorProfile ?? null;
  const canCharge = mentorProfile?.canChargeMentees ?? false;
  if (!canCharge) {
    const mentorPlan = await getMentorActivePlan(contract.mentorUserId);
    if (!mentorPlan?.canReceivePaidEngagements) {
      return {
        error: "MENTOR_NOT_SUBSCRIBED",
        message:
          "Mentor must be subscribed to the Mentor Marketplace plan to receive paid engagements.",
      };
    }
    return {
      error: "MENTOR_MONETISATION_LOCKED",
      message:
        "Mentor has not yet unlocked monetisation. Complete verified outcomes, Steno rate, and platform tenure requirements.",
    };
  }

  // Check pilot: seeker_pilot_open → fee waived (we still create escrow with amount for infrastructure)
  const pilotFlag = await prisma.featureFlag.findUnique({
    where: { key: "seeker_pilot_open" },
    select: { enabled: true },
  });
  const isPilot = pilotFlag?.enabled ?? false;

  const agreedFeePaise =
    contract.agreedFeePaise ??
    DEFAULT_ESCROW_FEE_PAISE[contract.engagementType as keyof typeof DEFAULT_ESCROW_FEE_PAISE];
  if (!agreedFeePaise) throw new Error("No agreed fee set for contract");

  const existing = await prisma.mentorshipEscrow.findUnique({
    where: { contractId },
  });
  if (existing) {
    if (existing.razorpayOrderId && existing.status === "PENDING_PAYMENT") {
      return {
        escrowId: existing.id,
        orderId: existing.razorpayOrderId,
        amount: existing.totalAmountPaise,
        currency: "INR",
      };
    }
    throw new Error("Escrow already exists for this contract");
  }

  const mentorTier = contract.mentor?.mentorProfile?.tier ?? "RISING";
  const feeRate = getFeeRate(mentorTier, paymentMode);
  const pilotFeeWaived = isPilot;

  let totalPaise: number;
  let platformFeePaise: number;
  let mentorPayoutPaise: number;

  if (paymentMode === "FULL_UPFRONT") {
    totalPaise = agreedFeePaise;
    platformFeePaise = pilotFeeWaived ? 0 : Math.round(totalPaise * feeRate);
    mentorPayoutPaise = totalPaise - platformFeePaise;

    const orderResult = await createOrder({
      amount: totalPaise,
      currency: "INR",
      receipt: `mentorship_${contractId}`,
      notes: {
        contractId,
        mentorId: contract.mentorUserId,
        menteeId: contract.menteeUserId,
        engagementType: contract.engagementType,
        paymentMode,
      },
    });

    const escrow = await prisma.mentorshipEscrow.create({
      data: {
        contractId,
        razorpayOrderId: orderResult.orderId,
        paymentMode: "FULL_UPFRONT",
        status: "PENDING_PAYMENT",
        totalAmountPaise: totalPaise,
        platformFeePaise,
        mentorPayoutPaise,
        pilotFeeWaived,
        mentorTierAtSigning: mentorTier,
        feeRate,
        mentorId: contract.mentorUserId,
        menteeId: contract.menteeUserId,
      },
    });

    const { trackOutcome } = await import("@/lib/tracking/outcomes");
    await trackOutcome(contract.menteeUserId, "M6_ESCROW_ORDER_CREATED", {
      entityId: escrow.id,
      entityType: "MentorshipEscrow",
      metadata: {
        contractId,
        amountPaise: totalPaise,
        isPilot,
        paymentMode: "FULL_UPFRONT",
      },
    });

    return {
      escrowId: escrow.id,
      orderId: orderResult.orderId,
      amount: orderResult.amount,
      currency: orderResult.currency,
    };
  }

  // ESCROW path — tranches
  const trancheResults = calculateTranches(agreedFeePaise, contract.engagementType);
  totalPaise = trancheResults.reduce((s, t) => s + t.amountPaise, 0);
  platformFeePaise = pilotFeeWaived ? 0 : Math.round(totalPaise * feeRate);
  mentorPayoutPaise = totalPaise - platformFeePaise;

  const orderResult = await createOrder({
    amount: totalPaise,
    currency: "INR",
    receipt: `mentorship_${contractId}`,
    notes: {
      contractId,
      mentorId: contract.mentorUserId,
      menteeId: contract.menteeUserId,
      engagementType: contract.engagementType,
    },
  });

  const escrow = await prisma.mentorshipEscrow.create({
    data: {
      contractId,
      razorpayOrderId: orderResult.orderId,
      paymentMode: "ESCROW",
      status: "PENDING_PAYMENT",
      totalAmountPaise: totalPaise,
      platformFeePaise,
      mentorPayoutPaise,
      pilotFeeWaived,
      mentorTierAtSigning: mentorTier,
      feeRate,
      mentorId: contract.mentorUserId,
      menteeId: contract.menteeUserId,
      tranches: {
        create: trancheResults.map((t) => ({
          trancheNumber: t.trancheNumber,
          amountPaise: t.amountPaise,
          percentPct: t.percentPct,
          status: "HELD",
        })),
      },
    },
  });

  // Tranches are linked to milestones in linkEscrowTranchesToMilestones when engagement is initialised (ACTIVE)

  const { trackOutcome } = await import("@/lib/tracking/outcomes");
  await trackOutcome(contract.menteeUserId, "M6_ESCROW_ORDER_CREATED", {
    entityId: escrow.id,
    entityType: "MentorshipEscrow",
    metadata: {
      contractId,
      amountPaise: totalPaise,
      isPilot,
    },
  });

  return {
    escrowId: escrow.id,
    orderId: orderResult.orderId,
    amount: orderResult.amount,
    currency: orderResult.currency,
  };
}

/** Called when Razorpay webhook confirms payment.captured. */
export async function confirmPayment(
  contractId: string,
  razorpayPaymentId: string
): Promise<void> {
  const escrow = await prisma.mentorshipEscrow.findUnique({
    where: { contractId },
    include: { tranches: true, contract: true },
  });
  if (!escrow) throw new Error("Escrow not found");
  if (escrow.status !== "PENDING_PAYMENT") {
    return;
  }

  const pilotFlag = await prisma.featureFlag.findUnique({
    where: { key: "seeker_pilot_open" },
    select: { enabled: true },
  });
  const pilotFeeWaived = pilotFlag?.enabled ?? false;

  if (escrow.paymentMode === "FULL_UPFRONT") {
    const mentorPayoutPaise = escrow.mentorPayoutPaise ?? escrow.totalAmountPaise;
    const platformFeePaise = escrow.platformFeePaise ?? 0;

    await recordPaymentMovement(escrow.id, escrow.contractId, null, {
      amountPaise: escrow.totalAmountPaise,
      direction: "IN" as MovementType,
      reasonCode: "ESCROW_FUNDED" as PaymentReasonCode,
      triggeredBy: "SYSTEM",
      notes: `Payment captured: ${razorpayPaymentId}`,
    });

    const { transferId } = await transferToMentor({
      amountPaise: mentorPayoutPaise,
      mentorId: escrow.mentorId,
      contractId: escrow.contractId,
      trancheId: null,
      reason: "FULL_UPFRONT_IMMEDIATE",
    });

    await recordPaymentMovement(escrow.id, escrow.contractId, null, {
      amountPaise: mentorPayoutPaise,
      direction: "OUT" as MovementType,
      reasonCode: "TRANCHE_RELEASED" as PaymentReasonCode,
      triggeredBy: "SYSTEM",
      notes: `FULL_UPFRONT release: ${transferId}`,
    });

    if (!pilotFeeWaived && platformFeePaise > 0) {
      await recordPaymentMovement(escrow.id, escrow.contractId, null, {
        amountPaise: platformFeePaise,
        direction: "PLATFORM_FEE" as MovementType,
        reasonCode: "OPS_OVERRIDE" as PaymentReasonCode,
        triggeredBy: "SYSTEM",
        notes: "Platform fee",
      });
    } else if (pilotFeeWaived) {
      await recordPaymentMovement(escrow.id, escrow.contractId, null, {
        amountPaise: 0,
        direction: "PLATFORM_FEE" as MovementType,
        reasonCode: "PILOT_WAIVER" as PaymentReasonCode,
        triggeredBy: "SYSTEM",
        notes: "Pilot fee waived",
      });
      const { trackOutcome } = await import("@/lib/tracking/outcomes");
      const systemActorId = process.env.M16_SYSTEM_ACTOR_ID ?? escrow.menteeId;
      trackOutcome(systemActorId, "M14_PILOT_FEE_WAIVED", {
        entityId: escrow.id,
        entityType: "MentorshipEscrow",
        metadata: { contractId, amountPaise: escrow.totalAmountPaise },
      }).catch(() => {});
    }

    await prisma.mentorshipEscrow.update({
      where: { id: escrow.id },
      data: {
        status: "COMPLETED",
        razorpayPaymentId,
        fundedAt: new Date(),
      },
    });

    const { createInvoice } = await import("@/lib/invoice/generate");
    try {
      await createInvoice({
        userId: escrow.menteeId,
        paymentType: "MENTORSHIP_TRANCHE",
        lineItems: [
          {
            description: "Mentorship Engagement — Full payment",
            unitPricePaise: escrow.totalAmountPaise,
          },
        ],
      });
    } catch (e) {
      console.error("[escrow] createInvoice on FULL_UPFRONT failed:", e);
    }

    const { trackOutcome } = await import("@/lib/tracking/outcomes");
    await trackOutcome(escrow.menteeId, "M6_ESCROW_FUNDED", {
      entityId: escrow.id,
      entityType: "MentorshipEscrow",
      metadata: { contractId, amountPaise: escrow.totalAmountPaise, paymentMode: "FULL_UPFRONT" },
    });

    return;
  }

  // ESCROW path
  await prisma.mentorshipEscrow.update({
    where: { id: escrow.id },
    data: {
      status: "FUNDED",
      razorpayPaymentId,
      fundedAt: new Date(),
    },
  });

  await recordPaymentMovement(escrow.id, escrow.contractId, null, {
    amountPaise: escrow.totalAmountPaise,
    direction: "IN" as MovementType,
    reasonCode: "ESCROW_FUNDED" as PaymentReasonCode,
    triggeredBy: "SYSTEM",
    notes: `Payment captured: ${razorpayPaymentId}`,
  });

  const { trackOutcome } = await import("@/lib/tracking/outcomes");
  await trackOutcome(escrow.menteeId, "M6_ESCROW_FUNDED", {
    entityId: escrow.id,
    entityType: "MentorshipEscrow",
    metadata: { contractId, amountPaise: escrow.totalAmountPaise },
  });
}

/** Record immutable payment movement. */
async function recordPaymentMovement(
  escrowId: string,
  contractId: string,
  trancheId: string | null,
  params: {
    amountPaise: number;
    direction: MovementType;
    reasonCode: PaymentReasonCode;
    triggeredBy: string | null;
    notes?: string;
  }
): Promise<void> {
  await prisma.paymentMovement.create({
    data: {
      escrowId,
      contractId,
      trancheId,
      amountPaise: params.amountPaise,
      direction: params.direction,
      reasonCode: params.reasonCode,
      triggeredBy: params.triggeredBy,
      notes: params.notes ?? null,
    },
  });
}

/** Called when milestone status → COMPLETE (both filed). Set tranche to PENDING_RELEASE, schedule auto-release. */
export async function markMilestonePendingRelease(milestoneId: string): Promise<void> {
  const milestone = await prisma.engagementMilestone.findUnique({
    where: { id: milestoneId },
    include: {
      contract: {
        include: { escrow: { include: { tranches: true } } },
      },
    },
  });
  if (!milestone) throw new Error("Milestone not found");
  const escrow = milestone.contract?.escrow;
  if (!escrow || escrow.status !== "FUNDED") return;

  const tranche = escrow.tranches.find((t) => t.milestoneId === milestoneId);
  if (!tranche || tranche.status !== "HELD") return;

  const autoReleaseAt = addDays(new Date(), AUTO_RELEASE_DAYS);

  await prisma.escrowTranche.update({
    where: { id: tranche.id },
    data: { status: "PENDING_RELEASE", autoReleaseAt },
  });

  logMentorshipAction({
    actorId: "SYSTEM",
    action: "TRANCHE_PENDING_RELEASE",
    category: "CONTRACT",
    entityType: "EscrowTranche",
    entityId: tranche.id,
    newState: { milestoneId, autoReleaseAt: autoReleaseAt.toISOString() },
  }).catch(() => {});
}

/** Mentee confirms tranche → immediate release. */
export async function confirmTranche(trancheId: string, menteeId: string): Promise<void> {
  await releaseTranche(trancheId, menteeId, "MENTEE_CONFIRMED");
}

/** M-9: Unfreeze tranche after dispute resolution. UPHELD = refund to mentee, REJECTED = release to mentor (OPS_OVERRIDE). */
export async function unfreezeTrancheForDispute(
  trancheId: string,
  outcome: "UPHELD" | "REJECTED"
): Promise<void> {
  const tranche = await prisma.escrowTranche.findUnique({
    where: { id: trancheId },
    include: { escrow: { include: { contract: true } } },
  });
  if (!tranche) throw new Error("Tranche not found");
  if (tranche.status !== "FROZEN") {
    throw new Error(`Tranche not frozen: ${tranche.status}`);
  }

  const systemActor = process.env.M16_SYSTEM_ACTOR_ID ?? "SYSTEM";

  if (outcome === "UPHELD") {
    const { refundToMentee } = await import("./route-stub");
    const { refundId } = await refundToMentee({
      amountPaise: tranche.amountPaise,
      menteeId: tranche.escrow.menteeId,
      contractId: tranche.escrow.contractId,
      trancheId,
      reason: "DISPUTE_UPHELD",
    });
    await prisma.escrowTranche.update({
      where: { id: trancheId },
      data: { status: "REFUNDED", releasedAt: new Date() },
    });
    await recordPaymentMovement(tranche.escrowId, tranche.escrow.contractId, trancheId, {
      amountPaise: tranche.amountPaise,
      direction: "OUT" as MovementType,
      reasonCode: "DISPUTE_RESOLVED_MENTEE" as PaymentReasonCode,
      triggeredBy: systemActor,
      notes: `Dispute upheld — refund ${refundId}`,
    });
  } else {
    await releaseTranche(trancheId, systemActor, "OPS_OVERRIDE", "DISPUTE_RESOLVED_MENTOR" as PaymentReasonCode);
  }
}

/** Mentee disputes → freeze tranche for ops review. */
export async function freezeTranche(
  trancheId: string,
  menteeId: string,
  reason: string
): Promise<void> {
  const tranche = await prisma.escrowTranche.findUnique({
    where: { id: trancheId },
    include: { escrow: { include: { contract: true } } },
  });
  if (!tranche) throw new Error("Tranche not found");
  if (tranche.escrow.menteeId !== menteeId) throw new Error("Forbidden");
  if (tranche.status !== "PENDING_RELEASE") {
    throw new Error("Tranche not in PENDING_RELEASE");
  }

  await prisma.escrowTranche.update({
    where: { id: trancheId },
    data: { status: "FROZEN", autoReleaseAt: null },
  });

  logMentorshipAction({
    actorId: menteeId,
    action: "TRANCHE_DISPUTED",
    category: "DISPUTE",
    entityType: "EscrowTranche",
    entityId: trancheId,
    newState: { reason: reason.slice(0, 500) },
    reason,
  }).catch(() => {});

  const { trackOutcome } = await import("@/lib/tracking/outcomes");
  await trackOutcome(menteeId, "M6_TRANCHE_DISPUTED", {
    entityId: trancheId,
    entityType: "EscrowTranche",
    metadata: { contractId: tranche.escrow.contractId },
  });
}

/** Release tranche to mentor. source: MENTEE_CONFIRMED | AUTO_RELEASE | OPS_OVERRIDE */
/** M-14: Fee rate at release = live tier. transferToMentor gets mentorNetPaise not full amount. */
/** paymentReasonOverride: M-9 dispute rejection uses DISPUTE_RESOLVED_MENTOR */
export async function releaseTranche(
  trancheId: string,
  triggeredBy: string,
  source: "MENTEE_CONFIRMED" | "AUTO_RELEASE" | "OPS_OVERRIDE",
  paymentReasonOverride?: PaymentReasonCode
): Promise<void> {
  const tranche = await prisma.escrowTranche.findUnique({
    where: { id: trancheId },
    include: { escrow: { include: { contract: true, tranches: true } } },
  });
  if (!tranche) throw new Error("Tranche not found");
  if (tranche.status !== "PENDING_RELEASE" && tranche.status !== "FROZEN") {
    if (tranche.status === "RELEASED") return;
    throw new Error(`Tranche not releasable: ${tranche.status}`);
  }
  if (tranche.status === "FROZEN" && source !== "OPS_OVERRIDE") {
    throw new Error("Frozen tranche requires OPS_OVERRIDE");
  }

  const now = new Date();
  const pilotFeeWaived = tranche.escrow.pilotFeeWaived ?? false;
  const { tier: liveTier, rate: liveFeeRate } = await getLiveFeeRate(
    tranche.escrow.mentorId,
    tranche.escrow.paymentMode
  );
  const { platformFeePaise, mentorNetPaise } = calculateFeeAmounts(
    tranche.amountPaise,
    liveFeeRate,
    pilotFeeWaived
  );

  const tierChanged = hasTierChanged(
    tranche.escrow.mentorTierAtSigning ?? null,
    liveTier
  );
  if (tierChanged) {
    const systemActorId = process.env.M16_SYSTEM_ACTOR_ID ?? tranche.escrow.mentorId;
    logMentorshipAction({
      actorId: systemActorId,
      action: "TRANCHE_FEE_RECALCULATED_TIER_CHANGE",
      category: "CONTRACT",
      entityType: "EscrowTranche",
      entityId: trancheId,
      newState: {
        tierAtSigning: tranche.escrow.mentorTierAtSigning,
        tierAtRelease: liveTier,
        platformFeePaise,
        mentorNetPaise,
      },
    }).catch(() => {});
  }

  const { transferId } = await transferToMentor({
    amountPaise: mentorNetPaise,
    mentorId: tranche.escrow.mentorId,
    contractId: tranche.escrow.contractId,
    trancheId: tranche.id,
    reason: source,
  });

  await prisma.escrowTranche.update({
    where: { id: trancheId },
    data: {
      status: "RELEASED",
      releasedAt: now,
      platformFeePaise,
      mentorNetPaise,
    },
  });

  await prisma.trancheFeeRecord.create({
    data: {
      trancheId,
      mentorTierAtRelease: liveTier,
      feeRateApplied: liveFeeRate,
      platformFeePaise,
      mentorNetPaise,
      pilotFeeWaived,
      paymentMode: tranche.escrow.paymentMode,
      releasedAt: now,
    },
  });

  const outReasonCode =
    paymentReasonOverride ??
    (source === "OPS_OVERRIDE" ? ("OPS_OVERRIDE" as PaymentReasonCode) : ("TRANCHE_RELEASED" as PaymentReasonCode));
  await recordPaymentMovement(tranche.escrowId, tranche.escrow.contractId, trancheId, {
    amountPaise: mentorNetPaise,
    direction: "OUT" as MovementType,
    reasonCode: outReasonCode,
    triggeredBy,
    notes: `Transfer ${transferId}`,
  });

  if (!pilotFeeWaived && platformFeePaise > 0) {
    await recordPaymentMovement(tranche.escrowId, tranche.escrow.contractId, trancheId, {
      amountPaise: platformFeePaise,
      direction: "PLATFORM_FEE" as MovementType,
      reasonCode: "OPS_OVERRIDE" as PaymentReasonCode,
      triggeredBy: "SYSTEM",
      notes: "Platform fee (M-14)",
    });
  }

  const { trackOutcome } = await import("@/lib/tracking/outcomes");
  trackOutcome(tranche.escrow.mentorId, "M14_TRANCHE_FEE_APPLIED", {
    entityId: trancheId,
    entityType: "EscrowTranche",
    metadata: {
      platformFeePaise,
      mentorNetPaise,
      tierChanged,
      tierAtRelease: liveTier,
    },
  }).catch(() => {});

  if (tierChanged) {
    trackOutcome(tranche.escrow.mentorId, "M14_TRANCHE_FEE_RECALCULATED", {
      entityId: trancheId,
      entityType: "EscrowTranche",
      metadata: { tierAtSigning: tranche.escrow.mentorTierAtSigning, tierAtRelease: liveTier },
    }).catch(() => {});
  }

  const { createInvoice } = await import("@/lib/invoice/generate");
  try {
    await createInvoice({
      userId: tranche.escrow.menteeId,
      paymentType: "MENTORSHIP_TRANCHE",
      lineItems: [
        {
          description: `Mentorship Engagement — Tranche ${tranche.trancheNumber} of ${tranche.escrow.tranches?.length ?? 1}`,
          unitPricePaise: tranche.amountPaise,
        },
      ],
      escrowTrancheId: trancheId,
    });
  } catch (e) {
    console.error("[escrow] createInvoice on release failed:", e);
  }
}

/** Early termination. Mentor → 100% remaining refunded to mentee. Mentee → released stay with mentor; unreleased refunded. */
export async function terminateEscrow(
  contractId: string,
  terminatedBy: "MENTOR" | "MENTEE"
): Promise<void> {
  const escrow = await prisma.mentorshipEscrow.findUnique({
    where: { contractId },
    include: { tranches: true, contract: true },
  });
  if (!escrow) return;
  if (escrow.status !== "FUNDED") return;

  const now = new Date();
  await prisma.mentorshipEscrow.update({
    where: { id: escrow.id },
    data: { status: "TERMINATED", terminatedAt: now },
  });

  for (const t of escrow.tranches) {
    if (t.status === "RELEASED") continue;

    if (terminatedBy === "MENTOR") {
      await refundToMentee({
        amountPaise: t.amountPaise,
        menteeId: escrow.menteeId,
        contractId,
        trancheId: t.id,
        reason: "MENTOR_TERMINATED",
      });
      await prisma.escrowTranche.update({
        where: { id: t.id },
        data: { status: "REFUNDED", releasedAt: now },
      });
      await recordPaymentMovement(escrow.id, contractId, t.id, {
        amountPaise: t.amountPaise,
        direction: "OUT" as MovementType,
        reasonCode: "TERMINATION_REFUND" as PaymentReasonCode,
        triggeredBy: "SYSTEM",
        notes: "Mentor terminated — full refund to mentee",
      });
    } else {
      if (t.status === "PENDING_RELEASE" || t.status === "HELD") {
        await refundToMentee({
          amountPaise: t.amountPaise,
          menteeId: escrow.menteeId,
          contractId,
          trancheId: t.id,
          reason: "MENTEE_TERMINATED",
        });
        await prisma.escrowTranche.update({
          where: { id: t.id },
          data: { status: "REFUNDED", releasedAt: now },
        });
        await recordPaymentMovement(escrow.id, contractId, t.id, {
          amountPaise: t.amountPaise,
          direction: "OUT" as MovementType,
          reasonCode: "TERMINATION_REFUND" as PaymentReasonCode,
          triggeredBy: "SYSTEM",
          notes: "Mentee terminated — unreleased refunded to mentee",
        });
      }
    }
  }
}

/** Contract voided before payment — no funds to move. */
export async function voidEscrow(contractId: string): Promise<void> {
  const escrow = await prisma.mentorshipEscrow.findUnique({
    where: { contractId },
  });
  if (!escrow) return;
  if (escrow.status === "FUNDED") {
    await terminateEscrow(contractId, "MENTOR");
    return;
  }

  await prisma.mentorshipEscrow.update({
    where: { id: escrow.id },
    data: { status: "VOIDED", voidedAt: new Date() },
  });
}

/** Link escrow tranches to milestones. Call when engagement is initialised (milestones exist). */
export async function linkEscrowTranchesToMilestones(contractId: string): Promise<void> {
  const escrow = await prisma.mentorshipEscrow.findUnique({
    where: { contractId },
    include: {
      tranches: { orderBy: { trancheNumber: "asc" } },
      contract: { select: { engagementType: true } },
    },
  });
  if (!escrow) return;

  const { TRANCHE_CONFIG } = await import("./tranches");
  const config = TRANCHE_CONFIG[escrow.contract.engagementType as keyof typeof TRANCHE_CONFIG];
  if (!config) return;

  const milestones = await prisma.engagementMilestone.findMany({
    where: { contractId },
    select: { id: true, milestoneNumber: true },
    orderBy: { milestoneNumber: "asc" },
  });

  for (const t of escrow.tranches) {
    const tc = config.tranches[t.trancheNumber - 1];
    if (tc) {
      const milestone = milestones.find((m) => m.milestoneNumber === tc.milestoneNumber);
      if (milestone) {
        await prisma.escrowTranche.update({
          where: { id: t.id },
          data: { milestoneId: milestone.id },
        });
      }
    }
  }
}

/** Get escrow with tranches for contract. */
export async function getEscrowByContract(contractId: string) {
  return prisma.mentorshipEscrow.findUnique({
    where: { contractId },
    include: {
      tranches: { orderBy: { trancheNumber: "asc" } },
      contract: { select: { status: true, engagementType: true, agreedFeePaise: true } },
    },
  });
}
