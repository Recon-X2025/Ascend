/**
 * Phase 10B: Enqueue weekly digest email for all seekers who opted in.
 * Run Monday 7am IST.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { weeklyDigestQueue } from "@/lib/queues";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: {
      role: "JOB_SEEKER",
      marketingConsent: true,
      bannedAt: null,
    },
    select: { id: true },
  });

  let enqueued = 0;
  for (const u of users) {
    try {
      await weeklyDigestQueue.add("send", { userId: u.id });
      enqueued++;
    } catch {
      // continue
    }
  }

  return NextResponse.json({ enqueued, total: users.length });
}
