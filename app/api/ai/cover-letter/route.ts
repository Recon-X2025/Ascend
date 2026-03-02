import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { isEnabled } from "@/lib/feature-flags";
import { rateLimit } from "@/lib/redis/ratelimit";
import { coverLetterQueue } from "@/lib/queues";
import { track, EVENTS } from "@/lib/analytics/track";

const COVER_LETTER_LIMIT = 5;
const WINDOW_SECONDS = 86400; // 1 day

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as { role?: string }).role !== "JOB_SEEKER") {
      return NextResponse.json({ success: false, error: "Only job seekers can generate cover letters" }, { status: 403 });
    }
    if (!(await isEnabled("cover_letter_generator"))) {
      return NextResponse.json({ success: false, error: "Feature not available" }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const jobId = typeof body.jobId === "number" ? body.jobId : parseInt(String(body.jobId), 10);
    if (Number.isNaN(jobId)) {
      return NextResponse.json({ success: false, error: "Invalid jobId" }, { status: 400 });
    }

    const jobExists = await prisma.jobPost.findUnique({
      where: { id: jobId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!jobExists) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    const rlKey = `cover-letter:${session.user.id}`;
    const { success, remaining } = await rateLimit(rlKey, COVER_LETTER_LIMIT, WINDOW_SECONDS);
    if (!success) {
      return NextResponse.json(
        { error: "Daily limit reached (5 cover letters per day)", remaining: 0 },
        { status: 429 }
      );
    }

    const resumeVersionId =
      body.resumeVersionId != null && body.resumeVersionId !== ""
        ? String(body.resumeVersionId)
        : null;
    const optionalNote =
      typeof body.optionalNote === "string" ? body.optionalNote.slice(0, 500) : null;

    await coverLetterQueue.add("generate", {
      userId: session.user.id,
      jobPostId: jobId,
      resumeVersionId,
      optionalNote,
    });

    track(
      EVENTS.COVER_LETTER_GENERATED,
      { jobId },
      { userId: session.user.id, persona: (session.user as { persona?: string }).persona }
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      jobId,
      message: "Cover letter generation started",
      remaining,
    });
  } catch (e) {
    console.error("[CoverLetter POST]", e);
    return NextResponse.json({ success: false, error: "Failed to queue cover letter" }, { status: 500 });
  }
}
