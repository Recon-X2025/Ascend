import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import type { InterviewExperience } from "@prisma/client";

const DIFFICULTY_MAP = {
  1: "EASY",
  2: "MEDIUM",
  3: "HARD",
  4: "VERY_HARD",
  5: "VERY_HARD",
} as const;

const postInterviewSchema = z.object({
  jobTitle: z.string().min(1).max(200),
  experience: z.enum(["positive", "neutral", "negative"]),
  difficulty: z.number().int().min(1).max(5),
  gotOffer: z.boolean().optional().nullable(),
  process: z.string().min(50),
  questions: z.array(z.string().max(500)).max(10).optional().default([]),
  durationDays: z.number().int().min(1).optional().nullable(),
  anonymous: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
  const sort = searchParams.get("sort") ?? "recent"; // recent | helpful

  const [reviews, totalCount] = await Promise.all([
    prisma.interviewReview.findMany({
      where: { companyId: company.id, status: "APPROVED" },
      orderBy:
        sort === "helpful"
          ? [{ helpfulCount: "desc" }, { createdAt: "desc" }]
          : [{ createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        jobTitle: true,
        experience: true,
        difficulty: true,
        gotOffer: true,
        process: true,
        sampleQuestions: true,
        durationDays: true,
        anonymous: true,
        helpfulCount: true,
        createdAt: true,
        user: { select: { name: true, image: true } },
      },
    }),
    prisma.interviewReview.count({ where: { companyId: company.id, status: "APPROVED" } }),
  ]);

  const approved = await prisma.interviewReview.findMany({
    where: { companyId: company.id, status: "APPROVED" },
    select: { experience: true, difficulty: true, gotOffer: true },
  });
  const experienceBreakdown = {
    positive: approved.filter((r) => r.experience === "POSITIVE").length,
    neutral: approved.filter((r) => r.experience === "NEUTRAL").length,
    negative: approved.filter((r) => r.experience === "NEGATIVE").length,
  };
  const difficultyNums = approved.map((r) =>
    r.difficulty === "EASY" ? 1 : r.difficulty === "MEDIUM" ? 2 : r.difficulty === "HARD" ? 3 : 4
  );
  const avgDifficulty =
    difficultyNums.length > 0
      ? Math.round((difficultyNums.reduce((a, b) => a + b, 0) / difficultyNums.length) * 10) / 10
      : 0;
  const withOffer = approved.filter((r) => r.gotOffer === true).length;
  const offerRate = approved.length > 0 ? Math.round((withOffer / approved.length) * 100) : 0;

  const items = reviews.map((r) => ({
    id: r.id,
    jobTitle: r.jobTitle,
    experience: r.experience,
    difficulty: r.difficulty,
    gotOffer: r.gotOffer,
    process: r.process,
    sampleQuestions: r.sampleQuestions,
    durationDays: r.durationDays,
    helpfulCount: r.helpfulCount,
    createdAt: r.createdAt,
    reviewer: r.anonymous
      ? { name: "Anonymous", image: null }
      : { name: r.user?.name ?? "User", image: r.user?.image ?? null },
  }));

  return NextResponse.json({
    reviews: items,
    totalCount,
    experienceBreakdown,
    avgDifficulty,
    offerRate,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const { allowed, resetIn } = await checkRateLimit(`interview:${userId}`, 3, 3600);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later.", resetIn },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = postInterviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const experience: InterviewExperience =
    parsed.data.experience === "positive"
      ? "POSITIVE"
      : parsed.data.experience === "neutral"
        ? "NEUTRAL"
        : "NEGATIVE";
  const difficultyKey = Math.min(5, Math.max(1, parsed.data.difficulty)) as 1 | 2 | 3 | 4 | 5;
  const difficulty = DIFFICULTY_MAP[difficultyKey];

  const existing = await prisma.interviewReview.findUnique({
    where: {
      userId_companyId_jobTitle: {
        userId,
        companyId: company.id,
        jobTitle: parsed.data.jobTitle,
      },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You have already submitted an interview review for this role at this company." },
      { status: 409 }
    );
  }

  const review = await prisma.interviewReview.create({
    data: {
      companyId: company.id,
      userId,
      jobTitle: parsed.data.jobTitle,
      experience,
      difficulty,
      gotOffer: parsed.data.gotOffer ?? null,
      process: parsed.data.process,
      sampleQuestions: parsed.data.questions,
      durationDays: parsed.data.durationDays ?? null,
      anonymous: parsed.data.anonymous ?? false,
      status: "PENDING",
    },
    select: { id: true, status: true },
  });

  return NextResponse.json({
    id: review.id,
    status: "PENDING",
    message: "Your interview review has been submitted.",
  });
}
