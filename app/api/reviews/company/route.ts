import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { getCompanyRatingAggregate } from "@/lib/companies/ratings";
import { checkReviewSubmitRateLimit } from "@/lib/reviews/rate-limit";
import { companyReviewSchema } from "@/lib/reviews/validate";
import { sanitizeReviewText } from "@/lib/reviews/sanitize";
import { sendReviewReceivedEmail } from "@/lib/email/templates/review-received";
import type { EmploymentStatus, EmploymentType, CEOApproval } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) {
    return NextResponse.json({ error: "companyId is required" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true },
  });
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
  const sort = searchParams.get("sort") ?? "recent"; // recent | helpful | rating_high | rating_low

  const [reviews, totalCount] = await Promise.all([
    prisma.companyReview.findMany({
      where: { companyId, status: "APPROVED" },
      orderBy:
        sort === "helpful"
          ? [{ helpfulCount: "desc" }, { createdAt: "desc" }]
          : sort === "rating_high"
            ? [{ overallRating: "desc" }, { createdAt: "desc" }]
            : sort === "rating_low"
              ? [{ overallRating: "asc" }, { createdAt: "desc" }]
              : [{ createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        headline: true,
        employmentStatus: true,
        jobTitle: true,
        employmentStart: true,
        employmentEnd: true,
        overallRating: true,
        workLifeRating: true,
        salaryRating: true,
        cultureRating: true,
        careerRating: true,
        managementRating: true,
        pros: true,
        cons: true,
        advice: true,
        recommend: true,
        ceoApproval: true,
        ceoApprovalRating: true,
        helpfulCount: true,
        notHelpfulCount: true,
        createdAt: true,
      },
    }),
    prisma.companyReview.count({ where: { companyId, status: "APPROVED" } }),
  ]);

  const agg = await getCompanyRatingAggregate(companyId);

  const items = reviews.map((r) => ({
    id: r.id,
    headline: r.headline ?? "",
    employmentStatus: r.employmentStatus,
    jobTitle: r.jobTitle,
    employmentStart: r.employmentStart,
    employmentEnd: r.employmentEnd,
    overallRating: r.overallRating,
    workLifeBalance: r.workLifeRating,
    culture: r.cultureRating,
    careerGrowth: r.careerRating,
    compensation: r.salaryRating,
    management: r.managementRating,
    pros: r.pros,
    cons: r.cons,
    advice: r.advice,
    wouldRecommend: r.recommend,
    ceoApproval: r.ceoApprovalRating ?? (r.ceoApproval === true ? "APPROVE" : r.ceoApproval === false ? "DISAPPROVE" : "NO_OPINION"),
    helpfulCount: r.helpfulCount,
    unhelpfulCount: r.notHelpfulCount,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({
    reviews: items,
    totalCount,
    page,
    limit,
    aggregate: agg
      ? {
          overallAvg: agg.overallAvg,
          workLifeAvg: agg.workLifeAvg,
          salaryAvg: agg.salaryAvg,
          cultureAvg: agg.cultureAvg,
          careerAvg: agg.careerAvg,
          managementAvg: agg.managementAvg,
          recommendPct: agg.recommendPct,
          ceoApprovalPct: agg.ceoApprovalPct,
          reviewCount: agg.reviewCount,
        }
      : null,
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
  const parsed = companyReviewSchema.safeParse(body);
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

  const existing = await prisma.companyReview.findUnique({
    where: { companyId_userId: { companyId: data.companyId, userId } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You have already submitted a review for this company." },
      { status: 409 }
    );
  }

  const employmentStatus: EmploymentStatus =
    data.employmentStatus === "CURRENT" ? "CURRENT" : "FORMER";
  const employmentType: EmploymentType =
    data.employmentType === "INTERNSHIP"
      ? "INTERNSHIP"
      : (data.employmentType as Exclude<EmploymentType, "INTERNSHIP">);
  const ceoApprovalRating: CEOApproval = data.ceoApproval as CEOApproval;

  const review = await prisma.companyReview.create({
    data: {
      companyId: data.companyId,
      userId,
      jobTitle: data.jobTitle.trim(),
      department: data.department?.trim() ?? null,
      employmentType,
      employmentStatus,
      employmentStart: data.employmentStart,
      employmentEnd: data.employmentEnd ?? null,
      headline: data.headline.trim(),
      overallRating: data.overallRating,
      workLifeRating: data.workLifeBalance,
      salaryRating: data.compensation,
      cultureRating: data.culture,
      careerRating: data.careerGrowth,
      managementRating: data.management,
      pros: sanitizeReviewText(data.pros),
      cons: sanitizeReviewText(data.cons),
      advice: data.advice ? sanitizeReviewText(data.advice) : null,
      recommend: data.wouldRecommend,
      ceoApprovalRating,
      status: "PENDING",
      anonymous: false,
    },
    select: { id: true, status: true },
  });

  await prisma.careerSignal.create({
    data: {
      userId,
      type: "REVIEW_SUBMITTED",
      companyId: data.companyId,
      metadata: { reviewId: review.id, kind: "company" },
    },
  });

  const author = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (author?.email) {
    try {
      await sendReviewReceivedEmail(author.email);
    } catch {}
  }

  return NextResponse.json({
    success: true,
    reviewId: review.id,
    status: "PENDING",
  });
}
