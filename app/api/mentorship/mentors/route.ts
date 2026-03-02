import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { scoreMentorMatch } from "@/lib/mentorship/match";
import type { MentorTransition, MentorFocusArea, SessionFormat, MentorStyle } from "@prisma/client";
import type { Prisma } from "@prisma/client";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const transition = searchParams.getAll("transition") as MentorTransition[];
  const focusArea = searchParams.getAll("focusArea") as MentorFocusArea[];
  const format = searchParams.getAll("format") as SessionFormat[];
  const style = searchParams.get("style") as MentorStyle | null;
  const crossBorder = searchParams.get("crossBorder");
  const city = searchParams.get("city")?.trim();
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const limit = Math.min(MAX_LIMIT, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10));

  const where: Prisma.MentorProfileWhereInput = {
    isDiscoverable: true,
    userId: { not: session.user.id },
    isActive: true,
  };

  if (transition.length) {
    where.transitionType = { in: transition };
  }
  if (focusArea.length) {
    where.focusAreas = { hasSome: focusArea };
  }
  if (format.length) {
    where.sessionFormats = { hasSome: format };
  }
  if (style) {
    where.mentoringStyles = { has: style };
  }
  if (crossBorder === "true") {
    where.crossBorderExperience = true;
  }
  if (city) {
    where.currentCity = { contains: city, mode: "insensitive" };
  }

  const [mentors, total, careerContext] = await Promise.all([
    prisma.mentorProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      take: limit + 1,
      skip: page * limit,
      orderBy: [{ averageRating: "desc" }, { totalSessions: "desc" }],
    }),
    prisma.mentorProfile.count({ where }),
    prisma.userCareerContext.findUnique({
      where: { userId: session.user.id },
    }),
  ]);

  const hasNext = mentors.length > limit;
  const items = hasNext ? mentors.slice(0, limit) : mentors;

  const TIER_BOOST = { RISING: 0, ESTABLISHED: 8, ELITE: 15 } as const;

  const cards = items.map((m) => {
    const score = scoreMentorMatch(m, careerContext);
    const tier = m.tier ?? "RISING";
    const boost = TIER_BOOST[tier] ?? 0;
    return {
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      image: m.user.image,
      currentRole: m.currentRole,
      currentCompany: m.currentCompany,
      transitionType: m.transitionType,
      previousRole: m.previousRole,
      focusAreas: m.focusAreas,
      sessionFormats: m.sessionFormats,
      averageRating: m.averageRating,
      totalSessions: m.totalSessions,
      totalMentees: m.totalMentees,
      crossBorderExperience: m.crossBorderExperience,
      matchScore: (score ?? 0) + boost,
      verifiedOutcomeCount: m.verifiedOutcomeCount ?? 0,
      tier: m.tier ?? "RISING",
    };
  });

  // Sort by match score descending (tier boost applied for ranking only)
  cards.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));

  return NextResponse.json({
    mentors: cards,
    total,
    page,
    limit,
    hasNext,
  });
}
