import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") ?? "PENDING";
  const typeFilter = searchParams.get("type") ?? "all"; // all | company | interview | salary
  const limit = 20;

  const pendingOnly = filter === "PENDING";

  const list: Array<{
    id: string;
    type: "company" | "interview" | "salary";
    companyName: string;
    companySlug: string;
    authorEmail: string;
    authorName: string | null;
    headline: string;
    preview: string;
    status: string;
    rejectionReason: string | null;
    createdAt: string;
    submittedHoursAgo: number;
  }> = [];

  const toItem = (
    type: "company" | "interview" | "salary",
    row: {
      id: string;
      status: string;
      rejectionReason: string | null;
      createdAt: Date;
      company: { name: string; slug: string };
      user: { email: string; name: string | null };
      headline?: string | null;
      pros?: string | null;
      cons?: string | null;
      processDesc?: string | null;
      process?: string | null;
      jobTitle?: string;
    }
  ) => {
    const headline = row.headline ?? row.jobTitle ?? "—";
    const preview =
      (row.pros?.slice(0, 100) ?? row.cons?.slice(0, 100) ?? row.processDesc?.slice(0, 100) ?? row.process?.slice(0, 100) ?? "") +
      (row.pros && row.pros.length > 100 ? "…" : row.cons && row.cons.length > 100 ? "…" : "");
    const submittedHoursAgo = Math.floor(
      (Date.now() - new Date(row.createdAt).getTime()) / (1000 * 60 * 60)
    );
    return {
      id: row.id,
      type,
      companyName: row.company.name,
      companySlug: row.company.slug,
      authorEmail: row.user.email,
      authorName: row.user.name,
      headline,
      preview,
      status: row.status,
      rejectionReason: row.rejectionReason,
      createdAt: row.createdAt.toISOString(),
      submittedHoursAgo,
    };
  };

  if (typeFilter === "all" || typeFilter === "company") {
    const companyReviews = await prisma.companyReview.findMany({
      where: pendingOnly ? { status: "PENDING" } : undefined,
      orderBy: { createdAt: "asc" },
      take: typeFilter === "company" ? limit : limit,
      select: {
        id: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
        headline: true,
        pros: true,
        cons: true,
        company: { select: { name: true, slug: true } },
        user: { select: { email: true, name: true } },
      },
    });
    companyReviews.forEach((r) => list.push(toItem("company", { ...r, jobTitle: "" })));
  }

  if (typeFilter === "all" || typeFilter === "interview") {
    const interviewReviews = await prisma.interviewReview.findMany({
      where: pendingOnly ? { status: "PENDING" } : undefined,
      orderBy: { createdAt: "asc" },
      take: typeFilter === "interview" ? limit : limit,
      select: {
        id: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
        headline: true,
        jobTitle: true,
        processDesc: true,
        process: true,
        company: { select: { name: true, slug: true } },
        user: { select: { email: true, name: true } },
      },
    });
    interviewReviews.forEach((r) =>
      list.push(toItem("interview", { ...r, pros: null, cons: null }))
    );
  }

  if (typeFilter === "all" || typeFilter === "salary") {
    const salaryReports = await prisma.salaryReport.findMany({
      where: pendingOnly ? { status: "PENDING" } : undefined,
      orderBy: { createdAt: "asc" },
      take: typeFilter === "salary" ? limit : limit,
      select: {
        id: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
        jobTitle: true,
        company: { select: { name: true, slug: true } },
        user: { select: { email: true, name: true } },
      },
    });
    salaryReports.forEach((r) =>
      list.push(
        toItem("salary", {
          ...r,
          headline: r.jobTitle,
          pros: null,
          cons: null,
          processDesc: null,
          process: null,
        })
      )
    );
  }

  list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const sliced = list.slice(0, limit);

  return NextResponse.json({
    reviews: sliced,
    nextCursor: list.length > limit ? sliced[sliced.length - 1]?.id : null,
    hasMore: list.length > limit,
  });
}
