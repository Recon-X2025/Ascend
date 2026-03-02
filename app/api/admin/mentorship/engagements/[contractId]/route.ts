import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { subDays } from "date-fns";

const STALLED_DAYS = 14;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { contractId } = await params;

  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
    include: {
      mentor: { select: { id: true, name: true, email: true } },
      mentee: { select: { id: true, name: true, email: true } },
      mentorApplication: { select: { id: true } },  // null for circle contracts
      sessions: { orderBy: { sessionNumber: "asc" } },
      milestones: { orderBy: { milestoneNumber: "asc" } },
      documents: true,
      outcome: true,
      signatures: true,
    },
  });

  if (!contract) return NextResponse.json({ success: false, error: "Contract not found" }, { status: 404 });

  const lastSession = contract.sessions
    .filter((s) => s.completedAt)
    .sort((a, b) => (b.completedAt!.getTime() - a.completedAt!.getTime()))[0];
  const stalledCutoff = subDays(new Date(), STALLED_DAYS);
  const stalled =
    contract.status === "ACTIVE" &&
    (!lastSession?.completedAt || lastSession.completedAt < stalledCutoff);
  const outcomeOverdue =
    contract.outcome?.status === "PENDING_MENTEE" &&
    contract.outcome.acknowledgementDeadline < new Date();

  const auditEntries = await prisma.mentorshipAuditLog.findMany({
    where: { entityType: "MentorshipContract", entityId: contractId },
    include: { actor: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    contract: {
      id: contract.id,
      status: contract.status,
      engagementType: contract.engagementType,
      engagementStart: contract.engagementStart,
      engagementEnd: contract.engagementEnd,
      mentor: contract.mentor,
      mentee: contract.mentee,
      generatedAt: contract.generatedAt,
      activatedAt: contract.activatedAt,
      completedAt: contract.completedAt,
      voidedAt: contract.voidedAt,
      signatures: contract.signatures,
    },
    sessions: contract.sessions.map((s) => ({
      id: s.id,
      sessionNumber: s.sessionNumber,
      status: s.status,
      scheduledAt: s.scheduledAt,
      completedAt: s.completedAt,
      durationMinutes: s.durationMinutes,
    })),
    milestones: contract.milestones.map((m) => ({
      id: m.id,
      milestoneNumber: m.milestoneNumber,
      type: m.type,
      dueDate: m.dueDate,
      status: m.status,
      completedAt: m.completedAt,
    })),
    documents: contract.documents.map((d) => ({
      id: d.id,
      type: d.type,
      mentorSigned: d.mentorSigned,
      menteeSigned: d.menteeSigned,
    })),
    outcome: contract.outcome
      ? {
          id: contract.outcome.id,
          status: contract.outcome.status,
          outcomeAchieved: contract.outcome.outcomeAchieved,
          transitionType: contract.outcome.transitionType,
          acknowledgementDeadline: contract.outcome.acknowledgementDeadline,
          menteeConfirmedAt: contract.outcome.menteeConfirmedAt,
          menteeDisputedAt: contract.outcome.menteeDisputedAt,
          opsReviewedAt: contract.outcome.opsReviewedAt,
          opsDecision: contract.outcome.opsDecision,
        }
      : null,
    auditLog: auditEntries.map((e) => ({
      id: e.id,
      actorName: e.actor.name ?? e.actor.email ?? e.actorId,
      action: e.action,
      category: e.category,
      previousState: e.previousState,
      newState: e.newState,
      reason: e.reason,
      createdAt: e.createdAt,
    })),
    flags: { stalled, outcomeOverdue, critical: stalled || outcomeOverdue },
  });
}
