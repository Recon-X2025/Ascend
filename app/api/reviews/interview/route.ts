import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { checkReviewSubmitRateLimit } from "@/lib/reviews/rate-limit";
import { interviewReviewSchema } from "@/lib/reviews/validate";
import { sanitizeReviewText } from "@/lib/reviews/sanitize";
import type { InterviewExperience, InterviewDifficulty, InterviewResult } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) {
    return NextResponse.json({ error: "companyId is required" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true },
  });
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
  const sort = searchParams.get("sort") ?? "recent";

  const [reviews, totalCount] = await Promise.all([
    prisma.interviewReview.findMany({
      where: { companyId, status: "APPROVED" },
      orderBy:
        sort === "helpful"
          ? [{ helpfulCount: "desc" }, { createdAt: "desc" }]
          : [{ createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        jobTitle: true,
        interviewYear: true,
        interviewResult: true,
        difficulty: true,
        experience: true,
        overallRating: true,
        headline: true,
        process: true,
        processDesc: true,
        questions: true,
        tips: true,
        roundCount: true,
        durationWeeks: true,
        helpfulCount: true,
        unhelpfulCount: true,
        createdAt: true,
      },
    }),
    prisma.interviewReview.count({ where: { companyId, status: "APPROVED" } }),
  ]);

  const items = reviews.map((r) => ({
    id: r.id,
    jobTitle: r.jobTitle,
    interviewYear: r.interviewYear,
    interviewResult: r.interviewResult,
    difficulty: r.difficulty,
    experience: r.experience,
    overallRating: r.overallRating ?? 0,
    headline: r.headline ?? "",
    processDesc: (r.processDesc ?? r.process) ?? "",
    questions: r.questions,
    tips: r.tips,
    roundCount: r.roundCount,
    durationWeeks: r.durationWeeks,
    helpfulCount: r.helpfulCount,
    unhelpfulCount: r.unhelpfulCount,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({
    reviews: items,
    totalCount,
    page,
    limit,
  });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed, resetIn } = await checkReviewSubmitRateLimit(userId);
  if (!allowed) {
    return NextResponse.json(
      {
        error:
          "You've submitted the maximum number of reviews today. Please try again tomorrow.",
        resetIn,
      },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = interviewReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const company = await prisma.company.findUnique({
    where: { id: data.companyId },
    select: { id: true },
  });
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const existing = await prisma.interviewReview.findFirst({
    where: {
      companyId: data.companyId,
      userId,
      interviewYear: data.interviewYear,
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You have already submitted an interview review for this company for this year." },
      { status: 409 }
    );
  }

  const experience: InterviewExperience = data.experience as InterviewExperience;
  const difficulty: InterviewDifficulty = data.difficulty as InterviewDifficulty;
  const interviewResult: InterviewResult | null = data.interviewResult as InterviewResult;

  const review = await prisma.interviewReview.create({
    data: {
      companyId: data.companyId,
      userId,
      jobTitle: data.jobTitle.trim(),
      interviewYear: data.interviewYear,
      interviewResult,
      difficulty,
      experience,
      overallRating: data.overallRating,
      headline: data.headline.trim(),
      processDesc: sanitizeReviewText(data.processDesc),
      process: sanitizeReviewText(data.processDesc),
      questions: data.questions ? sanitizeReviewText(data.questions) : null,
      tips: data.tips ? sanitizeReviewText(data.tips) : null,
      roundCount: data.roundCount ?? null,
      durationWeeks: data.durationWeeks ?? null,
      jobApplicationId: data.applicationId ?? null,
      status: "PENDING",
    },
    select: { id: true, status: true },
  });

  await prisma.careerSignal.create({
    data: {
      userId,
      type: "REVIEW_SUBMITTED",
      companyId: data.companyId,
      metadata: { reviewId: review.id, kind: "interview" },
    },
  });

  return NextResponse.json({
    success: true,
    reviewId: review.id,
    status: "PENDING",
  });
}
