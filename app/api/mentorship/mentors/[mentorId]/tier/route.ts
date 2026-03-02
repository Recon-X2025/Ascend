import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { TIER_CONFIG, recalculateMentorTier, type MentorTierKey } from "@/lib/mentorship/tiers";
import { z } from "zod";
import { logAudit } from "@/lib/audit/log";

const patchSchema = z.object({
  tier: z.enum(["RISING", "ESTABLISHED", "ELITE"]),
  note: z.string().max(1000).optional(),
});

/**
 * GET /api/mentorship/mentors/[mentorId]/tier — Public tier info. mentorId = MentorProfile.id.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mentorId: string }> }
) {
  const { mentorId } = await params;

  const profile = await prisma.mentorProfile.findFirst({
    where: { id: mentorId, isActive: true },
    select: {
      userId: true,
      tier: true,
      tierUpdatedAt: true,
      maxActiveMentees: true,
      verifiedOutcomeCount: true,
      disputeRate: true,
    },
  });

  if (!profile) {
    return NextResponse.json({ success: false, error: "Mentor not found" }, { status: 404 });
  }

  const config = TIER_CONFIG[profile.tier as MentorTierKey];
  const activeMenteeCount = await prisma.mentorshipContract.count({
    where: { mentorUserId: profile.userId, status: { in: ["ACTIVE", "PAUSED"] } },
  });

  return NextResponse.json({
    tier: profile.tier,
    tierUpdatedAt: profile.tierUpdatedAt?.toISOString() ?? null,
    maxActiveMentees: profile.maxActiveMentees,
    activeMenteeCount,
    platformFeePercent: config.platformFeePercent,
    priorityMatching: config.priorityMatching,
    featuredOnDiscovery: config.featuredOnDiscovery,
    verifiedOutcomeCount: profile.verifiedOutcomeCount,
    disputeRate: profile.disputeRate ?? 0,
  });
}

/**
 * PATCH /api/mentorship/mentors/[mentorId]/tier — Admin override tier. mentorId = MentorProfile.id.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ mentorId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { mentorId } = await params;
  const profile = await prisma.mentorProfile.findFirst({
    where: { id: mentorId },
    select: { userId: true },
  });
  if (!profile) {
    return NextResponse.json({ success: false, error: "Mentor not found" }, { status: 404 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ success: false, error: "Invalid body", details: e }, { status: 400 });
  }

  const profileBefore = await prisma.mentorProfile.findUnique({
    where: { userId: profile.userId },
    select: { tier: true },
  });

  await recalculateMentorTier(
    profile.userId,
    "ADMIN_OVERRIDE",
    session.user.id,
    body.tier,
    body.note ?? ""
  );

  const { logMentorshipAction } = await import("@/lib/mentorship/audit");
  await logMentorshipAction({
    actorId: session.user.id,
    action: "TIER_OVERRIDDEN",
    category: "TIER",
    entityType: "MentorProfile",
    entityId: mentorId,
    previousState: profileBefore ? { tier: profileBefore.tier } : undefined,
    newState: { tier: body.tier },
    reason: body.note ?? undefined,
  });

  await logAudit({
    actorId: session.user.id,
    category: "ADMIN_ACTION",
    action: "MENTOR_TIER_OVERRIDE",
    targetType: "MentorProfile",
    targetId: mentorId,
    metadata: { mentorUserId: profile.userId, tier: body.tier, note: body.note },
  });

  return NextResponse.json({ success: true });
}
