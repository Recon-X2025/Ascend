/**
 * GET /api/cron/mentorship-monetisation-check
 * Monday 06:00 IST = 0 30 * * 1 (00:30 UTC Monday)
 * Runs monetisation unlock check for all discoverable mentors.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { runMonetisationUnlockCheck } from "@/lib/mentorship/monetisation";
import { logAudit } from "@/lib/audit/log";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BATCH_SIZE = 30;
const DELAY_MS = 50;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const mentors = await prisma.mentorProfile.findMany({
    where: { isDiscoverable: true, isActive: true },
    select: { userId: true },
  });

  let checked = 0;
  for (let i = 0; i < mentors.length; i += BATCH_SIZE) {
    const batch = mentors.slice(i, i + BATCH_SIZE);
    for (const m of batch) {
      try {
        await runMonetisationUnlockCheck(m.userId);
        checked++;
      } catch (e) {
        console.error("[cron/mentorship-monetisation-check] Failed for", m.userId, e);
      }
    }
    if (i + BATCH_SIZE < mentors.length) {
      await delay(DELAY_MS);
    }
  }

  await logAudit({
    category: "SYSTEM",
    action: "CRON_MENTORSHIP_MONETISATION_CHECK",
    targetType: "Cron",
    targetId: "mentorship-monetisation-check",
    metadata: { mentorsProcessed: mentors.length, checked },
  });

  return NextResponse.json({
    ok: true,
    mentorsProcessed: mentors.length,
    checked,
  });
}
