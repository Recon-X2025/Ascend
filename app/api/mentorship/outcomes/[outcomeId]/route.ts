import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";
import { verifyOutcome, disputeOutcome, opsReviewOutcome } from "@/lib/mentorship/outcomes";

const verifySchema = z.object({ action: z.literal("verify"), note: z.string().max(500).optional() });
const disputeSchema = z.object({
  action: z.literal("dispute"),
  note: z.string().min(20).max(2000),
});
const opsReviewSchema = z.object({
  action: z.literal("ops-review"),
  decision: z.enum(["UPHELD", "OVERTURNED"]),
  note: z.string().min(1).max(1000),
});
const bodySchema = z.discriminatedUnion("action", [verifySchema, disputeSchema, opsReviewSchema]);

/**
 * GET /api/mentorship/outcomes/[outcomeId] — Full outcome. Mentor/admin see all; mentee excludes opsNote, opsReviewedBy.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ outcomeId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { outcomeId } = await params;

  const outcome = await prisma.mentorshipOutcome.findUnique({
    where: { id: outcomeId },
  });
  if (!outcome) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const isParty = outcome.mentorId === session.user.id || outcome.menteeId === session.user.id;
  const isAdmin = (session.user as { role?: string }).role === "PLATFORM_ADMIN";
  if (!isParty && !isAdmin) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const includeOps = outcome.mentorId === session.user.id || isAdmin;

  return NextResponse.json({
    id: outcome.id,
    contractId: outcome.contractId,
    mentorId: outcome.mentorId,
    menteeId: outcome.menteeId,
    outcomeAchieved: outcome.outcomeAchieved,
    transitionType: outcome.transitionType,
    claimedOutcome: outcome.claimedOutcome,
    mentorReflection: outcome.mentorReflection,
    testimonialConsent: outcome.testimonialConsent,
    status: outcome.status,
    menteeConfirmedAt: outcome.menteeConfirmedAt?.toISOString() ?? null,
    menteeDisputedAt: outcome.menteeDisputedAt?.toISOString() ?? null,
    menteeNote: outcome.menteeNote,
    acknowledgementDeadline: outcome.acknowledgementDeadline.toISOString(),
    opsReviewedAt: outcome.opsReviewedAt?.toISOString() ?? null,
    opsReviewedBy: includeOps ? outcome.opsReviewedBy : undefined,
    opsDecision: outcome.opsDecision,
    opsNote: includeOps ? outcome.opsNote : undefined,
    checkInStatus: outcome.checkInStatus,
    checkInDueAt: outcome.checkInDueAt?.toISOString() ?? null,
    checkInCompletedAt: outcome.checkInCompletedAt?.toISOString() ?? null,
    checkInNote: outcome.checkInNote,
    checkInBadgeGranted: outcome.checkInBadgeGranted,
    submittedAt: outcome.submittedAt.toISOString(),
  });
}

/**
 * PATCH /api/mentorship/outcomes/[outcomeId] — verify | dispute | ops-review
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ outcomeId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { outcomeId } = await params;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ success: false, error: "Invalid body", details: e }, { status: 400 });
  }

  try {
    if (body.action === "verify") {
      const outcome = await verifyOutcome(outcomeId, session.user.id, body.note);
      return NextResponse.json({ outcome: toOutcomeJson(outcome) });
    }
    if (body.action === "dispute") {
      const outcome = await disputeOutcome(outcomeId, session.user.id, body.note);
      return NextResponse.json({ outcome: toOutcomeJson(outcome) });
    }
    if (body.action === "ops-review") {
      const isAdmin = (session.user as { role?: string }).role === "PLATFORM_ADMIN";
      if (!isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      const outcome = await opsReviewOutcome(outcomeId, session.user.id, body.decision, body.note);
      return NextResponse.json({ outcome: toOutcomeJson(outcome) });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    if (message === "Forbidden" || message === "Outcome not found") {
      return NextResponse.json({ success: false, error: message }, { status: 403 });
    }
    if (message.includes("not pending") || message.includes("at least 20")) {
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
}

function toOutcomeJson(o: {
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
}) {
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
    opsReviewedBy: o.opsReviewedBy,
    opsDecision: o.opsDecision,
    opsNote: o.opsNote,
    checkInStatus: o.checkInStatus,
    checkInDueAt: o.checkInDueAt?.toISOString() ?? null,
    checkInCompletedAt: o.checkInCompletedAt?.toISOString() ?? null,
    checkInNote: o.checkInNote,
    checkInBadgeGranted: o.checkInBadgeGranted,
    submittedAt: o.submittedAt.toISOString(),
  };
}
