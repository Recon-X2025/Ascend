import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { getFitScore } from "@/lib/fit-score/service";
import { prisma } from "@/lib/prisma/client";
import { isEnabled } from "@/lib/feature-flags";
import { track, EVENTS } from "@/lib/analytics/track";
import { canUseFeature } from "@/lib/payments/gate";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? null : n;
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { id: idParam } = await params;
    const jobId = parseId(idParam);
    if (jobId == null) {
      return NextResponse.json({ score: null, message: "Invalid job id" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({
        score: null,
        message: "Sign in to see your fit score",
      });
    }

    if (!(await isEnabled("fit_score_enabled"))) {
      return NextResponse.json({ error: "Feature not available" }, { status: 503 });
    }

    const role = session.user.role ?? "JOB_SEEKER";
    if (role !== "JOB_SEEKER") {
      return NextResponse.json({
        score: null,
        message: "Fit score is for job seekers",
      });
    }

    const jobExists = await prisma.jobPost.findUnique({
      where: { id: jobId },
      select: { id: true },
    });
    if (!jobExists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get("refresh") === "true";

    const result = await getFitScore(session.user.id, String(jobId), forceRefresh);
    if (result == null) {
      return NextResponse.json(
        { error: "Failed to compute fit score" },
        { status: 500 }
      );
    }

    track(EVENTS.FIT_SCORE_VIEWED, { jobId }, { userId: session.user.id, persona: (session.user as { persona?: string }).persona ?? undefined }).catch(() => {});

    const { allowed: breakdownAllowed } = await canUseFeature(session.user.id, "fitScoreBreakdown");
    if (!breakdownAllowed) {
      return NextResponse.json({
        overallScore: result.overallScore,
        computedAt: result.computedAt.toISOString(),
        breakdown: false,
        message: "Upgrade to Premium to see score breakdown",
      });
    }

    return NextResponse.json({
      overallScore: result.overallScore,
      skillsScore: result.skillsScore,
      experienceScore: result.experienceScore,
      educationScore: result.educationScore,
      keywordsScore: result.keywordsScore,
      skillGaps: result.skillGaps,
      experienceGaps: result.experienceGaps,
      keywordGaps: result.keywordGaps,
      strengths: result.strengths,
      cached: result.cached,
      computedAt: result.computedAt.toISOString(),
      breakdown: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to compute fit score" },
      { status: 500 }
    );
  }
}
