import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { createNotification } from "@/lib/notifications/create";
import { NotificationType } from "@prisma/client";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { OutcomeEventType } from "@prisma/client";
import { rateLimit } from "@/lib/redis/ratelimit";
import { z } from "zod";

const ENDORSEMENTS_PER_WEEK = 5;
const WEEK_SECONDS = 7 * 24 * 60 * 60;

const bodySchema = z.object({
  recipientId: z.string().min(1),
  skill: z.string().min(1).max(200),
});

async function areConnected(userIdA: string, userIdB: string): Promise<boolean> {
  const connection = await prisma.connection.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: userIdA, recipientId: userIdB },
        { requesterId: userIdB, recipientId: userIdA },
      ],
    },
  });
  return !!connection;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors?.recipientId?.[0] ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { recipientId, skill } = parsed.data;
  const endorserId = session.user.id;

  if (endorserId === recipientId) {
    return NextResponse.json({ success: false, error: "Cannot endorse your own skill" }, { status: 400 });
  }

  const connected = await areConnected(endorserId, recipientId);
  if (!connected) {
    return NextResponse.json(
      { error: "You can only endorse skills of your 1st-degree connections" },
      { status: 403 }
    );
  }

  const { success } = await rateLimit(
    `endorsements:${endorserId}`,
    ENDORSEMENTS_PER_WEEK,
    WEEK_SECONDS
  );
  if (!success) {
    return NextResponse.json(
      { error: "You can give at most 5 endorsements per week" },
      { status: 429 }
    );
  }

  const skillTrimmed = skill.trim();
  if (!skillTrimmed) {
    return NextResponse.json({ success: false, error: "Skill is required" }, { status: 400 });
  }

  try {
    await prisma.profileEndorsement.create({
      data: { endorserId, recipientId, skill: skillTrimmed },
    });
  } catch (e) {
    const prismaError = e as { code?: string };
    if (prismaError.code === "P2002") {
      return NextResponse.json({ success: false, error: "You already endorsed this skill" }, { status: 409 });
    }
    throw e;
  }

  const [endorser, recipientProfile] = await Promise.all([
    prisma.user.findUnique({ where: { id: endorserId }, select: { name: true } }),
    prisma.jobSeekerProfile.findUnique({
      where: { userId: recipientId },
      select: { username: true },
    }),
  ]);
  const endorserName = endorser?.name ?? "Someone";
  const profileSlug = recipientProfile?.username ? `/profile/${recipientProfile.username}#skills` : "/profile/#skills";

  await createNotification({
    userId: recipientId,
    type: NotificationType.SKILL_ENDORSED,
    title: "Skill endorsed",
    body: `${endorserName} endorsed your ${skillTrimmed} skill`,
    linkUrl: profileSlug,
  });

  trackOutcome(endorserId, "PHASE19_SKILL_ENDORSED" as OutcomeEventType, {
    entityId: recipientId,
    metadata: { skill: skillTrimmed },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
