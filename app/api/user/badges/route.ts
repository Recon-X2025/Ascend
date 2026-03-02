import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { z } from "zod";

const postSchema = z.object({
  provider: z.string().min(1).max(100),
  skill: z.string().min(1).max(100),
  score: z.number().optional(),
  percentile: z.number().min(0).max(100).optional(),
  badgeUrl: z.string().url().optional(),
  verificationUrl: z.string().url().optional(),
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const badges = await prisma.profileBadge.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
  });

  return NextResponse.json({
    badges: badges.map((b) => ({
      id: b.id,
      provider: b.provider,
      skill: b.skill,
      score: b.score,
      percentile: b.percentile,
      badgeUrl: b.badgeUrl,
      verificationUrl: b.verificationUrl,
      issuedAt: b.issuedAt.toISOString(),
      expiresAt: b.expiresAt?.toISOString() ?? null,
      status: b.status,
    })),
  });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const parsed = postSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid body", issues: parsed.error.issues }, { status: 400 });

  const { provider, skill, score, percentile, badgeUrl, verificationUrl, issuedAt, expiresAt } = parsed.data;

  const badge = await prisma.profileBadge.create({
    data: {
      userId,
      provider,
      skill,
      score: score ?? null,
      percentile: percentile ?? null,
      badgeUrl: badgeUrl ?? null,
      verificationUrl: verificationUrl ?? null,
      issuedAt: new Date(issuedAt),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      status: "ACTIVE",
    },
  });

  await trackOutcome(userId, "PHASE22_BADGE_ADDED", {
    entityId: badge.id,
    entityType: "ProfileBadge",
    metadata: { provider, skill },
  });

  return NextResponse.json({
    badge: {
      id: badge.id,
      provider: badge.provider,
      skill: badge.skill,
      score: badge.score,
      percentile: badge.percentile,
      badgeUrl: badge.badgeUrl,
      verificationUrl: badge.verificationUrl,
      issuedAt: badge.issuedAt.toISOString(),
      expiresAt: badge.expiresAt?.toISOString() ?? null,
      status: badge.status,
    },
  });
}
