import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

/**
 * GET /api/mentorship/outcomes/mentor/[mentorId] — Public. mentorId = User.id of mentor.
 * Returns aggregated outcome stats for mentor profile. Only VERIFIED outcomes; testimonials with consent only.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mentorId: string }> }
) {
  const { mentorId } = await params;

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: mentorId },
    select: {
      verifiedOutcomeCount: true,
      totalEngagements: true,
      avgTimeToOutcomeDays: true,
      outcomeTypes: true,
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
  }

  const recentTestimonials = await prisma.mentorshipOutcome.findMany({
    where: {
      mentorId,
      status: "VERIFIED",
      testimonialConsent: true,
    },
    select: {
      claimedOutcome: true,
      transitionType: true,
      menteeConfirmedAt: true,
    },
    orderBy: { menteeConfirmedAt: "desc" },
    take: 3,
  });

  return NextResponse.json({
    verifiedOutcomeCount: profile.verifiedOutcomeCount,
    totalEngagements: profile.totalEngagements,
    avgTimeToOutcomeDays: profile.avgTimeToOutcomeDays,
    outcomeTypes: profile.outcomeTypes,
    recentTestimonials: recentTestimonials.map((t) => ({
      claimedOutcome: t.claimedOutcome,
      transitionType: t.transitionType,
      verifiedAt: t.menteeConfirmedAt?.toISOString() ?? null,
    })),
  });
}
