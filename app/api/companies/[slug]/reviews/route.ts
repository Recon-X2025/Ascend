import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { getCompanyRatingAggregate } from "@/lib/companies/ratings";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit/log";
import { getRequestContext } from "@/lib/audit/context";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { z } from "zod";
import type { EmploymentStatus } from "@prisma/client";

const postReviewSchema = z.object({
  employmentStatus: z.enum(["current", "former"]),
  jobTitle: z.string().min(1).max(200),
  location: z.string().max(200).optional().nullable(),
  startYear: z.number().int().min(1900).max(2100).optional().nullable(),
  endYear: z.number().int().min(1900).max(2100).optional().nullable(),
  overallRating: z.number().min(1).max(5),
  workLifeRating: z.number().min(1).max(5).optional().nullable(),
  salaryRating: z.number().min(1).max(5).optional().nullable(),
  cultureRating: z.number().min(1).max(5).optional().nullable(),
  careerRating: z.number().min(1).max(5).optional().nullable(),
  managementRating: z.number().min(1).max(5).optional().nullable(),
  pros: z.string().min(50),
  cons: z.string().min(50),
  advice: z.string().max(5000).optional().nullable(),
  recommend: z.boolean(),
  ceoApproval: z.boolean().optional().nullable(),
  anonymous: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
  if (!company) return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
  const sort = searchParams.get("sort") ?? "recent"; // recent | helpful | rating

  const [reviews, totalCount] = await Promise.all([
    prisma.companyReview.findMany({
      where: { companyId: company.id, status: "APPROVED" },
      orderBy:
        sort === "helpful"
          ? [{ helpfulCount: "desc" }, { createdAt: "desc" }]
          : sort === "rating"
            ? [{ overallRating: "desc" }, { createdAt: "desc" }]
            : [{ createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        employmentStatus: true,
        jobTitle: true,
        location: true,
        startDate: true,
        endDate: true,
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
        anonymous: true,
        helpfulCount: true,
        notHelpfulCount: true,
        createdAt: true,
        user: {
          select: { name: true, image: true },
        },
      },
    }),
    prisma.companyReview.count({ where: { companyId: company.id, status: "APPROVED" } }),
  ]);

  const agg = await getCompanyRatingAggregate(company.id);
  const approved = await prisma.companyReview.findMany({
    where: { companyId: company.id, status: "APPROVED" },
    select: {
      overallRating: true,
      workLifeRating: true,
      salaryRating: true,
      cultureRating: true,
      managementRating: true,
    },
  });

  const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  approved.forEach((r) => {
    const k = Math.round(r.overallRating) as 1 | 2 | 3 | 4 | 5;
    if (k >= 1 && k <= 5) ratingBreakdown[k]++;
  });

  const subRatings = agg
    ? {
        workLife: agg.workLifeAvg,
        salary: agg.salaryAvg,
        culture: agg.cultureAvg,
        career: agg.careerAvg,
        management: agg.managementAvg,
      }
    : { workLife: null, salary: null, culture: null, career: null, management: null };

  const items = reviews.map((r) => ({
    id: r.id,
    employmentStatus: r.employmentStatus,
    jobTitle: r.jobTitle,
    location: r.location,
    startYear: r.startDate ? new Date(r.startDate).getFullYear() : null,
    endYear: r.endDate ? new Date(r.endDate).getFullYear() : null,
    overallRating: r.overallRating,
    workLifeRating: r.workLifeRating,
    salaryRating: r.salaryRating,
    cultureRating: r.cultureRating,
    careerRating: r.careerRating,
    managementRating: r.managementRating,
    pros: r.pros,
    cons: r.cons,
    advice: r.advice,
    recommend: r.recommend,
    ceoApproval: r.ceoApproval,
    helpfulCount: r.helpfulCount,
    notHelpfulCount: r.notHelpfulCount,
    createdAt: r.createdAt,
    reviewer: r.anonymous
      ? { name: "Anonymous", image: null }
      : { name: r.user?.name ?? "User", image: r.user?.image ?? null },
  }));

  return NextResponse.json({
    reviews: items,
    totalCount,
    averageRating: agg?.overallAvg ?? 0,
    ratingBreakdown,
    subRatings,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
  if (!company) return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });

  const { allowed, resetIn } = await checkRateLimit(
    `review:${userId}`,
    3,
    3600
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later.", resetIn },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = postReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const existing = await prisma.companyReview.findUnique({
    where: { companyId_userId: { companyId: company.id, userId } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You have already submitted a review for this company." },
      { status: 409 }
    );
  }

  const employmentStatus: EmploymentStatus =
    parsed.data.employmentStatus === "current" ? "CURRENT" : "FORMER";
  const startDate = parsed.data.startYear
    ? new Date(parsed.data.startYear, 0, 1)
    : null;
  const endDate = parsed.data.endYear
    ? new Date(parsed.data.endYear, 0, 1)
    : null;

  const review = await prisma.companyReview.create({
    data: {
      companyId: company.id,
      userId,
      employmentStatus,
      jobTitle: parsed.data.jobTitle,
      location: parsed.data.location ?? null,
      startDate,
      endDate,
      overallRating: Math.round(parsed.data.overallRating),
      workLifeRating: parsed.data.workLifeRating ?? null,
      salaryRating: parsed.data.salaryRating ?? null,
      cultureRating: parsed.data.cultureRating ?? null,
      careerRating: parsed.data.careerRating ?? null,
      managementRating: parsed.data.managementRating ?? null,
      pros: parsed.data.pros,
      cons: parsed.data.cons,
      advice: parsed.data.advice ?? null,
      recommend: parsed.data.recommend,
      ceoApproval: parsed.data.ceoApproval ?? null,
      anonymous: parsed.data.anonymous ?? false,
      status: "PENDING",
    },
    select: { id: true, status: true },
  });
  try {
    const { actorIp, actorAgent } = getRequestContext(req);
    await logAudit({
      actorId: userId,
      actorIp: actorIp ?? undefined,
      actorAgent: actorAgent ?? undefined,
      category: "DATA_MUTATION",
      action: AUDIT_ACTIONS.REVIEW_SUBMITTED,
      severity: "INFO",
      targetType: "CompanyReview",
      targetId: review.id,
      metadata: { companyId: company.id, reviewId: review.id },
    });
  } catch {
    // non-blocking
  }

  return NextResponse.json({
    id: review.id,
    status: "PENDING",
    message: "Your review has been submitted and is awaiting approval.",
  });
}
