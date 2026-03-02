import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const [companyReviews, interviewReviews, salaryReports] = await Promise.all([
    prisma.companyReview.findMany({
      where: { userId },
      select: {
        id: true,
        companyId: true,
        company: { select: { name: true, slug: true } },
        status: true,
        rejectionReason: true,
        headline: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.interviewReview.findMany({
      where: { userId },
      select: {
        id: true,
        companyId: true,
        company: { select: { name: true, slug: true } },
        status: true,
        rejectionReason: true,
        headline: true,
        jobTitle: true,
        interviewYear: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.salaryReport.findMany({
      where: { userId },
      select: {
        id: true,
        companyId: true,
        company: { select: { name: true, slug: true } },
        status: true,
        jobTitle: true,
        year: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    companyReviews: companyReviews.map((r) => ({
      id: r.id,
      companyId: r.companyId,
      companyName: r.company.name,
      companySlug: r.company.slug,
      type: "company",
      status: r.status,
      rejectionReason: r.rejectionReason,
      headline: r.headline,
      createdAt: r.createdAt.toISOString(),
    })),
    interviewReviews: interviewReviews.map((r) => ({
      id: r.id,
      companyId: r.companyId,
      companyName: r.company.name,
      companySlug: r.company.slug,
      type: "interview",
      status: r.status,
      rejectionReason: r.rejectionReason,
      headline: r.headline,
      jobTitle: r.jobTitle,
      interviewYear: r.interviewYear,
      createdAt: r.createdAt.toISOString(),
    })),
    salarySubmissions: salaryReports.map((r) => ({
      id: r.id,
      companyId: r.companyId,
      companyName: r.company.name,
      companySlug: r.company.slug,
      type: "salary",
      status: r.status,
      jobTitle: r.jobTitle,
      year: r.year,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
