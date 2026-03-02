import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mentorId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { mentorId } = await params;

  const profile = await prisma.mentorProfile.findUnique({
    where: { id: mentorId },
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true } },
      verification: {
        include: {
          auditLog: {
            orderBy: { createdAt: "desc" },
            take: 20,
            include: { admin: { select: { name: true, email: true } } },
          },
        },
      },
      applications: {
        where: { status: "ACCEPTED" },
        include: {
          contract: {
            select: {
              id: true,
              status: true,
              engagementType: true,
              engagementStart: true,
              mentee: { select: { name: true, email: true } },
            },
          },
        },
      },
    },
  });

  if (!profile) return NextResponse.json({ success: false, error: "Mentor not found" }, { status: 404 });

  const tierHistory = await prisma.mentorTierHistory.findMany({
    where: { mentorId: profile.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const outcomeStats = await prisma.mentorshipOutcome.groupBy({
    by: ["status"],
    where: { mentorId: profile.userId },
    _count: { id: true },
  });
  const verifiedCount = outcomeStats.find((s) => s.status === "VERIFIED")?._count.id ?? 0;
  const disputedCount = outcomeStats.find((s) => s.status === "DISPUTED")?._count.id ?? 0;
  const unackCount = outcomeStats.find((s) => s.status === "PENDING_MENTEE")?._count.id ?? 0;

  const contractIds = profile.applications
    .map((a) => a.contract?.id)
    .filter((id): id is string => Boolean(id));
  const auditWhere =
    contractIds.length > 0
      ? {
          OR: [
            { entityType: "MentorProfile", entityId: mentorId },
            { entityType: "MentorshipContract", entityId: { in: contractIds } },
          ],
        }
      : { entityType: "MentorProfile", entityId: mentorId };

  const auditEntries = await prisma.mentorshipAuditLog.findMany({
    where: auditWhere,
    include: { actor: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const contracts = profile.applications
    .map((a) => a.contract)
    .filter(Boolean) as Array<{
    id: string;
    status: string;
    engagementType: string;
    engagementStart: Date | null;
    mentee: { name: string | null; email: string | null };
  }>;

  return NextResponse.json({
    profile: {
      id: profile.id,
      userId: profile.userId,
      name: profile.user?.name ?? profile.user?.email,
      email: profile.user?.email,
      tier: profile.tier,
      tierUpdatedAt: profile.tierUpdatedAt,
      tierOverriddenByAdmin: profile.tierOverriddenByAdmin,
      verificationStatus: profile.verificationStatus,
      verifiedOutcomeCount: profile.verifiedOutcomeCount,
      disputeRate: profile.disputeRate,
      activeMenteeCount: profile.activeMenteeCount,
      maxActiveMentees: profile.maxActiveMentees,
      currentRole: profile.currentRole,
      currentCompany: profile.currentCompany,
      transitionType: profile.transitionType,
      verifiedAt: profile.verifiedAt,
    },
    verificationHistory: profile.verification?.auditLog.map((e) => ({
      id: e.id,
      decision: e.decision,
      reasonCode: e.reasonCode,
      note: e.note,
      adminName: e.admin.name ?? e.admin.email,
      createdAt: e.createdAt,
    })) ?? [],
    tierHistory: tierHistory.map((h) => ({
      id: h.id,
      previousTier: h.previousTier,
      newTier: h.newTier,
      reason: h.reason,
      triggeredBy: h.triggeredBy,
      createdAt: h.createdAt,
    })),
    engagements: contracts.map((c) => ({
      contractId: c.id,
      status: c.status,
      engagementType: c.engagementType,
      startDate: c.engagementStart,
      menteeName: c.mentee?.name ?? c.mentee?.email,
    })),
    outcomeStats: {
      verified: verifiedCount,
      disputed: disputedCount,
      unacknowledged: unackCount,
    },
    auditLog: auditEntries.map((e) => ({
      id: e.id,
      action: e.action,
      category: e.category,
      entityType: e.entityType,
      entityId: e.entityId,
      actorName: e.actor.name ?? e.actor.email ?? e.actorId,
      previousState: e.previousState,
      newState: e.newState,
      reason: e.reason,
      createdAt: e.createdAt,
    })),
  });
}
