import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireRecruiterSession, assertApplicationAccess } from "@/lib/recruiter-intelligence/auth";
import { logAdminAction } from "@/lib/admin/audit";
import sanitizeHtml from "sanitize-html";

const NOTES_MAX = 2000;
const SCORE_MIN = 1;
const SCORE_MAX = 5;
const RECOMMENDATIONS = ["STRONG_YES", "YES", "UNDECIDED", "NO", "STRONG_NO"] as const;

function sanitizeNotes(input: string | null | undefined): string | null {
  if (input == null || typeof input !== "string") return null;
  const trimmed = input.trim().slice(0, NOTES_MAX);
  if (!trimmed) return null;
  return sanitizeHtml(trimmed, { allowedTags: [], allowedAttributes: {} });
}

export async function POST(req: Request) {
  const auth = await requireRecruiterSession();
  if ("error" in auth) return auth.error;

  let body: {
    jobApplicationId: string;
    technicalScore?: number | null;
    communicationScore?: number | null;
    cultureScore?: number | null;
    problemSolvingScore?: number | null;
    overallScore?: number | null;
    notes?: string | null;
    recommendation?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const { jobApplicationId, ...rest } = body;
  if (!jobApplicationId) {
    return NextResponse.json({ success: false, error: "jobApplicationId is required" }, { status: 400 });
  }
  const hasAccess = await assertApplicationAccess(auth.userId, jobApplicationId);
  if (!hasAccess) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const app = await prisma.jobApplication.findUnique({
    where: { id: jobApplicationId },
    select: { jobPostId: true },
  });
  if (!app) {
    return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
  }

  const clamp = (n: number | null | undefined) =>
    n == null ? null : Math.min(SCORE_MAX, Math.max(SCORE_MIN, Math.round(n)));
  const technicalScore = clamp(rest.technicalScore);
  const communicationScore = clamp(rest.communicationScore);
  const cultureScore = clamp(rest.cultureScore);
  const problemSolvingScore = clamp(rest.problemSolvingScore);
  let overallScore = clamp(rest.overallScore);
  const notes = sanitizeNotes(rest.notes);
  const recommendation = RECOMMENDATIONS.includes(rest.recommendation as (typeof RECOMMENDATIONS)[number])
    ? (rest.recommendation as (typeof RECOMMENDATIONS)[0])
    : "UNDECIDED";

  if (overallScore == null && [technicalScore, communicationScore, cultureScore, problemSolvingScore].every((s) => s != null)) {
    const arr = [technicalScore, communicationScore, cultureScore, problemSolvingScore].filter(
      (x): x is number => x != null
    );
    overallScore = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  }

  const scorecard = await prisma.interviewScorecard.upsert({
    where: {
      jobApplicationId_recruiterId: { jobApplicationId, recruiterId: auth.userId },
    },
    create: {
      jobApplicationId,
      recruiterId: auth.userId,
      jobPostId: app.jobPostId,
      technicalScore,
      communicationScore,
      cultureScore,
      problemSolvingScore,
      overallScore,
      notes,
      recommendation,
    },
    update: {
      ...(technicalScore !== undefined && { technicalScore }),
      ...(communicationScore !== undefined && { communicationScore }),
      ...(cultureScore !== undefined && { cultureScore }),
      ...(problemSolvingScore !== undefined && { problemSolvingScore }),
      ...(overallScore !== undefined && { overallScore }),
      ...(notes !== undefined && { notes }),
      recommendation,
    },
  });

  await logAdminAction({
    adminId: auth.userId,
    action: "SCORECARD_SUBMITTED",
    targetType: "InterviewScorecard",
    targetId: scorecard.id,
    metadata: { jobApplicationId, jobPostId: app.jobPostId },
  });

  return NextResponse.json({
    id: scorecard.id,
    jobApplicationId: scorecard.jobApplicationId,
    recruiterId: scorecard.recruiterId,
    technicalScore: scorecard.technicalScore,
    communicationScore: scorecard.communicationScore,
    cultureScore: scorecard.cultureScore,
    problemSolvingScore: scorecard.problemSolvingScore,
    overallScore: scorecard.overallScore,
    notes: scorecard.notes,
    recommendation: scorecard.recommendation,
    createdAt: scorecard.createdAt.toISOString(),
    updatedAt: scorecard.updatedAt.toISOString(),
  });
}

export async function GET(req: Request) {
  const auth = await requireRecruiterSession();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const jobApplicationId = url.searchParams.get("jobApplicationId");
  if (!jobApplicationId) {
    return NextResponse.json({ success: false, error: "jobApplicationId is required" }, { status: 400 });
  }
  const hasAccess = await assertApplicationAccess(auth.userId, jobApplicationId);
  if (!hasAccess) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const scorecards = await prisma.interviewScorecard.findMany({
    where: { jobApplicationId },
    include: {
      recruiter: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  function avg(arr: (number | null)[]): number {
    const nums = arr.filter((x): x is number => x != null);
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  }

  const withScores = scorecards.map((s) => ({
    id: s.id,
    recruiterId: s.recruiterId,
    recruiterName: s.recruiter.name,
    technicalScore: s.technicalScore,
    communicationScore: s.communicationScore,
    cultureScore: s.cultureScore,
    problemSolvingScore: s.problemSolvingScore,
    overallScore: s.overallScore,
    notes: s.notes,
    recommendation: s.recommendation,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  const avgScores = withScores.length
    ? {
        technicalScore: avg(withScores.map((s) => s.technicalScore)),
        communicationScore: avg(withScores.map((s) => s.communicationScore)),
        cultureScore: avg(withScores.map((s) => s.cultureScore)),
        problemSolvingScore: avg(withScores.map((s) => s.problemSolvingScore)),
        overallScore: avg(withScores.map((s) => s.overallScore)),
      }
    : null;

  return NextResponse.json({
    scorecards: withScores,
    averageScores: avgScores,
  });
}
