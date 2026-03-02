import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { track, EVENTS } from "@/lib/analytics/track";
import { redis } from "@/lib/redis/client";
import { RECOMMENDED_CACHE_KEY } from "@/lib/jobs/recommended";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? null : n;
}

export async function POST(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const jobId = parseId(id);
  if (jobId == null) {
    return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  }

  const job = await prisma.jobPost.findUnique({
    where: { id: jobId },
    select: { id: true },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  await prisma.jobDismissal.upsert({
    where: { userId_jobPostId: { userId: session.user.id, jobPostId: jobId } },
    create: { userId: session.user.id, jobPostId: jobId },
    update: {},
  });

  try {
    await redis.del(RECOMMENDED_CACHE_KEY(session.user.id));
  } catch {
    // non-blocking; recommendations will refresh on next load
  }

  track(
    EVENTS.JOB_RECOMMENDATION_DISMISSED,
    { jobId },
    { userId: session.user.id, persona: (session.user as { persona?: string }).persona }
  ).catch(() => {});

  return NextResponse.json({ success: true });
}
