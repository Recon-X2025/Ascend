import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { isEnabled } from "@/lib/feature-flags";
import { rateLimit } from "@/lib/redis/ratelimit";
import { interviewPrepQueue } from "@/lib/queues";
import { track, EVENTS } from "@/lib/analytics/track";

const INTERVIEW_PREP_LIMIT = 3;
const WINDOW_SECONDS = 86400; // 1 day

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as { role?: string }).role !== "JOB_SEEKER") {
      return NextResponse.json({ success: false, error: "Only job seekers can use interview prep" }, { status: 403 });
    }
    if (!(await isEnabled("interview_prep"))) {
      return NextResponse.json({ success: false, error: "Feature not available" }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const jobId = typeof body.jobId === "number" ? body.jobId : parseInt(String(body.jobId), 10);
    if (Number.isNaN(jobId)) {
      return NextResponse.json({ success: false, error: "Invalid jobId" }, { status: 400 });
    }

    const jobExists = await prisma.jobPost.findUnique({
      where: { id: jobId },
      select: { id: true },
    });
    if (!jobExists) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    const rlKey = `interview-prep:${session.user.id}`;
    const { success, remaining } = await rateLimit(rlKey, INTERVIEW_PREP_LIMIT, WINDOW_SECONDS);
    if (!success) {
      return NextResponse.json(
        { error: "Daily limit reached (3 interview prep generations per day)", remaining: 0 },
        { status: 429 }
      );
    }

    await interviewPrepQueue.add("generate", {
      userId: session.user.id,
      jobPostId: jobId,
    });

    track(
      EVENTS.INTERVIEW_PREP_GENERATED,
      { jobId },
      { userId: session.user.id, persona: (session.user as { persona?: string }).persona }
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      jobId,
      message: "Interview prep generation started",
      remaining,
    });
  } catch (e) {
    console.error("[InterviewPrep POST]", e);
    return NextResponse.json({ success: false, error: "Failed to queue interview prep" }, { status: 500 });
  }
}
