import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const company = await prisma.company.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }
  const admin = await prisma.companyAdmin.findFirst({
    where: { companyId: company.id, userId: session.user.id },
  });
  const role = (session.user as { role?: string }).role;
  if (!admin && role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const since = new Date();
  since.setDate(since.getDate() - 90);

  // Closed jobs in last 90 days (closed = status CLOSED or we use statusUpdatedAt on applications)
  const closedJobs = await prisma.jobPost.findMany({
    where: {
      companyId: company.id,
      status: "CLOSED",
      updatedAt: { gte: since },
    },
    select: {
      id: true,
      visibility: true,
      publishedAt: true,
      createdAt: true,
      title: true,
      _count: { select: { jobApplications: true } },
    },
  });

  const closedJobIds = closedJobs.map((j) => j.id);

  const applicationsByJob = closedJobIds.length
    ? await prisma.jobApplication.groupBy({
        by: ["jobPostId", "status"],
        where: { jobPostId: { in: closedJobIds } },
        _count: true,
      })
    : [];

  const offeredByJob = new Map<number, number>();
  const shortlistedByJob = new Map<number, number>();
  for (const row of applicationsByJob) {
    if (row.status === "OFFERED") {
      offeredByJob.set(row.jobPostId, (offeredByJob.get(row.jobPostId) ?? 0) + row._count);
    }
    if (row.status === "SHORTLISTED") {
      shortlistedByJob.set(row.jobPostId, (shortlistedByJob.get(row.jobPostId) ?? 0) + row._count);
    }
  }

  let internalFilled = 0;
  const totalClosed = closedJobs.length;
  const offeredAppDates =
    closedJobIds.length > 0
      ? await prisma.jobApplication.findMany({
          where: { jobPostId: { in: closedJobIds }, status: "OFFERED" },
          select: { jobPostId: true, statusUpdatedAt: true },
        })
      : [];
  const firstOfferedByJob = new Map<number, Date>();
  for (const app of offeredAppDates) {
    const existing = firstOfferedByJob.get(app.jobPostId);
    if (!existing || (app.statusUpdatedAt && app.statusUpdatedAt < existing)) {
      if (app.statusUpdatedAt) firstOfferedByJob.set(app.jobPostId, app.statusUpdatedAt);
    }
  }

  let internalTimeToFillSum = 0;
  let internalTimeToFillCount = 0;
  let externalTimeToFillSum = 0;
  let externalTimeToFillCount = 0;

  for (const job of closedJobs) {
    const offered = offeredByJob.get(job.id) ?? 0;
    const filled = offered > 0;
    if (filled && job.visibility === "INTERNAL") {
      internalFilled += 1;
    }
    const firstOffered = job.publishedAt ? firstOfferedByJob.get(job.id) : null;
    if (filled && job.publishedAt && firstOffered) {
      const days = Math.round(
        (firstOffered.getTime() - job.publishedAt.getTime()) / (24 * 60 * 60 * 1000)
      );
      if (job.visibility === "INTERNAL") {
        internalTimeToFillSum += days;
        internalTimeToFillCount += 1;
      } else {
        externalTimeToFillSum += days;
        externalTimeToFillCount += 1;
      }
    }
  }

  const internalFillRate = totalClosed > 0 ? (internalFilled / totalClosed) * 100 : 0;
  const avgTimeToFillInternal =
    internalTimeToFillCount > 0 ? internalTimeToFillSum / internalTimeToFillCount : null;
  const avgTimeToFillExternal =
    externalTimeToFillCount > 0 ? externalTimeToFillSum / externalTimeToFillCount : null;

  // Referrals in last 90 days
  const referrals = await prisma.jobReferral.findMany({
    where: {
      jobPost: { companyId: company.id },
      referredAt: { gte: since },
    },
    select: {
      outcome: true,
      referrerId: true,
    },
  });
  const totalReferrals = referrals.length;
  const referralAppliedOrHired = referrals.filter(
    (r) => r.outcome === "APPLIED" || r.outcome === "SHORTLISTED" || r.outcome === "HIRED"
  ).length;
  const referralConversionRate =
    totalReferrals > 0 ? (referralAppliedOrHired / totalReferrals) * 100 : 0;

  // Referral leaderboard: by referrer
  const referrerIds = Array.from(new Set(referrals.map((r) => r.referrerId)));
  const leaderboard: { referrerId: string; name: string; sent: number; applied: number; hired: number }[] = [];
  if (referrerIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: referrerIds } },
      select: { id: true, name: true },
    });
    const nameById = new Map(users.map((u) => [u.id, u.name ?? "Unknown"]));
    for (const rid of referrerIds) {
      const refs = referrals.filter((r) => r.referrerId === rid);
      leaderboard.push({
        referrerId: rid,
        name: nameById.get(rid) ?? "Unknown",
        sent: refs.length,
        applied: refs.filter((r) => ["APPLIED", "SHORTLISTED", "HIRED"].includes(r.outcome)).length,
        hired: refs.filter((r) => r.outcome === "HIRED").length,
      });
    }
    leaderboard.sort((a, b) => b.sent - a.sent);
  }

  // Internal job performance: INTERNAL jobs (last 90 days by createdAt)
  const internalJobs = await prisma.jobPost.findMany({
    where: {
      companyId: company.id,
      visibility: "INTERNAL",
      createdAt: { gte: since },
    },
    select: {
      id: true,
      title: true,
      publishedAt: true,
      createdAt: true,
      status: true,
      _count: { select: { jobApplications: true } },
    },
  });
  const internalJobIds = internalJobs.map((j) => j.id);
  const appCounts =
    internalJobIds.length > 0
      ? await prisma.jobApplication.groupBy({
          by: ["jobPostId", "status"],
          where: { jobPostId: { in: internalJobIds } },
          _count: true,
        })
      : [];
  const shortlistedByInternalJob = new Map<number, number>();
  const offeredByInternalJob = new Map<number, number>();
  for (const row of appCounts) {
    if (row.status === "SHORTLISTED") {
      shortlistedByInternalJob.set(row.jobPostId, (shortlistedByInternalJob.get(row.jobPostId) ?? 0) + row._count);
    }
    if (row.status === "OFFERED") {
      offeredByInternalJob.set(row.jobPostId, (offeredByInternalJob.get(row.jobPostId) ?? 0) + row._count);
    }
  }

  const internalJobPerformance = internalJobs.map((job) => {
    const publishedAt = job.publishedAt ?? job.createdAt;
    const now = new Date();
    const daysOpen = publishedAt
      ? Math.floor((now.getTime() - publishedAt.getTime()) / (24 * 60 * 60 * 1000))
      : 0;
    return {
      id: job.id,
      title: job.title,
      postedDate: publishedAt?.toISOString() ?? job.createdAt.toISOString(),
      applications: job._count.jobApplications,
      shortlisted: shortlistedByInternalJob.get(job.id) ?? 0,
      hired: offeredByInternalJob.get(job.id) ?? 0,
      daysOpen,
    };
  });

  return NextResponse.json({
    internalFillRate: Math.round(internalFillRate * 10) / 10,
    avgTimeToFillInternal: avgTimeToFillInternal != null ? Math.round(avgTimeToFillInternal) : null,
    avgTimeToFillExternal: avgTimeToFillExternal != null ? Math.round(avgTimeToFillExternal) : null,
    referralConversionRate: Math.round(referralConversionRate * 10) / 10,
    referralLeaderboard: leaderboard,
    internalJobPerformance,
  });
}
