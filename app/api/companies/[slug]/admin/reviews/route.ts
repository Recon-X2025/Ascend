import { NextResponse } from "next/server";
import type { Prisma, ReviewStatus } from "@prisma/client";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { isCompanyOwnerOrAdmin } from "@/lib/companies/permissions";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { slug } = await params;
  const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
  if (!company) return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
  if (!(await isCompanyOwnerOrAdmin(userId, company.id)))
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const sp = new URL(req.url).searchParams;
  const statusFilter = sp.get("status") ?? "all"; // all | PENDING | APPROVED | FLAGGED | REJECTED
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "10", 10)));
  const where: Prisma.CompanyReviewWhereInput = { companyId: company.id };
  if (statusFilter !== "all") where.status = statusFilter as ReviewStatus;
  const [reviews, totalCount] = await Promise.all([
    prisma.companyReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        jobTitle: true,
        overallRating: true,
        status: true,
        anonymous: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
    prisma.companyReview.count({ where }),
  ]);
  const items = reviews.map((r) => ({
    id: r.id,
    jobTitle: r.jobTitle,
    overallRating: r.overallRating,
    status: r.status,
    reviewer: r.anonymous ? "Anonymous" : (r.user?.name ?? "User"),
    createdAt: r.createdAt,
  }));
  return NextResponse.json({ reviews: items, totalCount });
}
