/**
 * POST /api/mentorship/mentor/monetisation-check
 * Mentor only. Triggers monetisation unlock check. Rate limit 1/24hrs via Redis.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { runMonetisationUnlockCheck } from "@/lib/mentorship/monetisation";
import { rateLimit } from "@/lib/redis/ratelimit";

const WINDOW_SECONDS = 24 * 60 * 60; // 24 hours
const MAX_PER_WINDOW = 1;

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "Mentor profile required" }, { status: 403 });
  }

  const { success } = await rateLimit(
    `monetisation-check:${session.user.id}`,
    MAX_PER_WINDOW,
    WINDOW_SECONDS
  );
  if (!success) {
    return NextResponse.json(
      { error: "Rate limited. You can run this check once per 24 hours." },
      { status: 429 }
    );
  }

  await runMonetisationUnlockCheck(session.user.id);

  const updated = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
    include: { monetisationStatus: true },
  });

  return NextResponse.json({
    ok: true,
    isUnlocked: updated?.monetisationStatus?.isUnlocked ?? false,
    canChargeMentees: updated?.canChargeMentees ?? false,
  });
}
