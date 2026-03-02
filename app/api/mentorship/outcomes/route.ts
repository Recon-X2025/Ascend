import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";
import { submitOutcomeClaim } from "@/lib/mentorship/outcomes";

const bodySchema = z.object({
  contractId: z.string().min(1),
  outcomeAchieved: z.boolean(),
  transitionType: z.string().min(1).max(100),
  claimedOutcome: z.string().min(1).max(500),
  mentorReflection: z.string().max(500).optional(),
  testimonialConsent: z.boolean(),
});

/**
 * POST /api/mentorship/outcomes — Mentor submits outcome claim.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ success: false, error: "Invalid body", details: e }, { status: 400 });
  }

  try {
    const outcome = await submitOutcomeClaim(body.contractId, session.user.id, {
      outcomeAchieved: body.outcomeAchieved,
      transitionType: body.transitionType,
      claimedOutcome: body.claimedOutcome,
      mentorReflection: body.mentorReflection,
      testimonialConsent: body.testimonialConsent,
    });
    return NextResponse.json({ outcome: toOutcomeJson(outcome, true) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    if (message === "Forbidden" || message === "Contract not found") {
      return NextResponse.json({ success: false, error: message }, { status: 403 });
    }
    if (message === "Outcome already submitted for this contract") {
      return NextResponse.json({ success: false, error: message }, { status: 409 });
    }
    if (message.includes("Engagement end") || message.includes("must be ACTIVE")) {
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

/**
 * GET /api/mentorship/outcomes?contractId= — Returns outcome for contract (if exists).
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const contractId = searchParams.get("contractId");
  if (!contractId) {
    return NextResponse.json({ success: false, error: "contractId required" }, { status: 400 });
  }

  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
    include: { outcome: true },
  });
  if (!contract) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  if (contract.mentorUserId !== session.user.id && contract.menteeUserId !== session.user.id) {
    const isAdmin = (session.user as { role?: string }).role === "PLATFORM_ADMIN";
    if (!isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  if (!contract.outcome) {
    return NextResponse.json({ outcome: null });
  }

  const isAdmin = (session.user as { role?: string }).role === "PLATFORM_ADMIN";
  const includeOps = contract.mentorUserId === session.user.id || isAdmin;
  return NextResponse.json({
    outcome: toOutcomeJson(contract.outcome, includeOps),
  });
}

function toOutcomeJson(
  o: {
    id: string;
    contractId: string;
    mentorId: string;
    menteeId: string;
    outcomeAchieved: boolean;
    transitionType: string;
    claimedOutcome: string;
    mentorReflection: string | null;
    testimonialConsent: boolean;
    status: string;
    menteeConfirmedAt: Date | null;
    menteeDisputedAt: Date | null;
    menteeNote: string | null;
    acknowledgementDeadline: Date;
    opsReviewedAt: Date | null;
    opsReviewedBy: string | null;
    opsDecision: string | null;
    opsNote: string | null;
    checkInStatus: string;
    checkInDueAt: Date | null;
    checkInCompletedAt: Date | null;
    checkInNote: string | null;
    checkInBadgeGranted: boolean;
    submittedAt: Date;
  },
  includeOps?: boolean
) {
  return {
    id: o.id,
    contractId: o.contractId,
    mentorId: o.mentorId,
    menteeId: o.menteeId,
    outcomeAchieved: o.outcomeAchieved,
    transitionType: o.transitionType,
    claimedOutcome: o.claimedOutcome,
    mentorReflection: o.mentorReflection,
    testimonialConsent: o.testimonialConsent,
    status: o.status,
    menteeConfirmedAt: o.menteeConfirmedAt?.toISOString() ?? null,
    menteeDisputedAt: o.menteeDisputedAt?.toISOString() ?? null,
    menteeNote: o.menteeNote,
    acknowledgementDeadline: o.acknowledgementDeadline.toISOString(),
    opsReviewedAt: o.opsReviewedAt?.toISOString() ?? null,
    opsReviewedBy: includeOps ? o.opsReviewedBy : undefined,
    opsDecision: o.opsDecision,
    opsNote: includeOps ? o.opsNote : undefined,
    checkInStatus: o.checkInStatus,
    checkInDueAt: o.checkInDueAt?.toISOString() ?? null,
    checkInCompletedAt: o.checkInCompletedAt?.toISOString() ?? null,
    checkInNote: o.checkInNote,
    checkInBadgeGranted: o.checkInBadgeGranted,
    submittedAt: o.submittedAt.toISOString(),
  };
}
