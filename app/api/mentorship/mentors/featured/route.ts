import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { MENTOR_TRANSITION_LABELS } from "@/lib/mentorship/labels";
import type { MentorTransition } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * M-11: Featured mentors = ELITE, discoverable, with capacity. Max 3, sorted by verifiedOutcomeCount desc.
 */
export async function GET() {
  const mentors = await prisma.mentorProfile.findMany({
    where: {
      isActive: true,
      isDiscoverable: true,
      tier: "ELITE",
    },
    take: 3,
    orderBy: [{ verifiedOutcomeCount: "desc" }, { averageRating: "desc" }],
    include: {
      user: { select: { name: true, image: true } },
    },
  });

  const mentorIds = mentors.map((m) => m.userId);
  const activeCounts = await Promise.all(
    mentorIds.map((userId) =>
      prisma.mentorshipContract.count({ where: { mentorUserId: userId, status: "ACTIVE" } })
    )
  );

  const cards = mentors
    .map((m, i) => ({ m, activeCount: activeCounts[i], max: m.maxActiveMentees }))
    .filter(({ activeCount, max }) => activeCount < max)
    .slice(0, 3)
    .map(({ m }) => ({
      id: m.id,
      name: m.user.name,
      image: m.user.image,
      currentRole: m.currentRole,
      currentCompany: m.currentCompany,
      transitionType: m.transitionType,
      transitionLabel: m.transitionType ? MENTOR_TRANSITION_LABELS[m.transitionType as MentorTransition] : null,
      averageRating: m.averageRating,
      totalSessions: m.totalSessions,
      sessionFormats: m.sessionFormats,
      tier: "ELITE" as const,
    }));

  return NextResponse.json({ mentors: cards });
}
