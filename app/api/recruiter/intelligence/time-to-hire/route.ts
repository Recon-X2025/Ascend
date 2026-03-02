import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireRecruiterSession, assertCompanyAccess } from "@/lib/recruiter-intelligence/auth";

const PERIOD_DAYS = { "30d": 30, "90d": 90, "180d": 180 } as const;

export async function GET(req: Request) {
  const auth = await requireRecruiterSession();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const companyId = url.searchParams.get("companyId");
  const jobPostIdParam = url.searchParams.get("jobPostId");
  const periodKey = (url.searchParams.get("period") ?? "90d") as keyof typeof PERIOD_DAYS;
  const periodDays = PERIOD_DAYS[periodKey] ?? 90;

  if (!companyId) {
    return NextResponse.json({ success: false, error: "companyId is required" }, { status: 400 });
  }
  const hasAccess = await assertCompanyAccess(auth.userId, companyId);
  if (!hasAccess) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const since = new Date();
  since.setDate(since.getDate() - periodDays);

  const jobFilter =
    jobPostIdParam !== null && jobPostIdParam !== ""
      ? { jobPostId: parseInt(jobPostIdParam, 10), companyId }
      : { companyId };
  const jobWhere =
    typeof jobFilter.jobPostId === "number" && !Number.isNaN(jobFilter.jobPostId)
      ? { id: jobFilter.jobPostId, companyId }
      : { companyId };

  const hiredApps = await prisma.jobApplication.findMany({
    where: {
      status: "OFFERED",
      statusUpdatedAt: { gte: since },
      jobPost: jobWhere,
    },
    select: {
      id: true,
      submittedAt: true,
      statusUpdatedAt: true,
      applicationTimeline: true,
      jobPost: { select: { title: true, recruiterId: true } },
    },
  });

  type StageDays = {
    daysToFirstView: number | null;
    daysToShortlist: number | null;
    daysToInterview: number | null;
    daysToOffer: number | null;
    daysToHire: number | null;
  };

  function daysBetween(a: Date, b: Date): number {
    return (b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000);
  }

  function getStageTimestamp(
    timeline: unknown,
    status: string
  ): Date | null {
    if (!timeline || !Array.isArray(timeline)) return null;
    const entry = (timeline as { status: string; at: string }[]).find(
      (e) => e.status === status && e.at
    );
    return entry ? new Date(entry.at) : null;
  }

  const stageDaysList: StageDays[] = hiredApps.map((app) => {
    const submitted = app.submittedAt;
    const offeredAt = app.statusUpdatedAt;
    const timeline = app.applicationTimeline as { status: string; at: string }[] | null;

    const firstView = getStageTimestamp(timeline, "UNDER_REVIEW") ?? getStageTimestamp(timeline, "VIEWED");
    const shortlist = getStageTimestamp(timeline, "SHORTLISTED");
    const interview = getStageTimestamp(timeline, "INTERVIEW_SCHEDULED");
    const offer = offeredAt;

    return {
      daysToFirstView: firstView ? daysBetween(submitted, firstView) : null,
      daysToShortlist: shortlist ? daysBetween(submitted, shortlist) : null,
      daysToInterview: interview ? daysBetween(submitted, interview) : null,
      daysToOffer: offer ? daysBetween(submitted, offer) : null,
      daysToHire: offer ? daysBetween(submitted, offer) : null,
    };
  });

  function avg(arr: (number | null)[], def: number): number {
    const nums = arr.filter((x): x is number => x != null);
    if (nums.length === 0) return def;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }

  const companyAvg = {
    daysToFirstView: avg(stageDaysList.map((s) => s.daysToFirstView), 0),
    daysToShortlist: avg(stageDaysList.map((s) => s.daysToShortlist), 0),
    daysToInterview: avg(stageDaysList.map((s) => s.daysToInterview), 0),
    daysToOffer: avg(stageDaysList.map((s) => s.daysToOffer), 0),
    daysToHire: avg(stageDaysList.map((s) => s.daysToHire), 0),
  };

  const titles = Array.from(new Set(hiredApps.map((a) => a.jobPost.title.trim().toLowerCase())));
  const byRole = titles.map((normTitle) => {
    const roleApps = hiredApps.filter(
      (a) => a.jobPost.title.trim().toLowerCase() === normTitle
    );
    const roleDays = roleApps.map((app) => {
      const submitted = app.submittedAt;
      const offeredAt = app.statusUpdatedAt;
      return (offeredAt.getTime() - submitted.getTime()) / (24 * 60 * 60 * 1000);
    });
    const avgDays = roleDays.length ? roleDays.reduce((a, b) => a + b, 0) / roleDays.length : 0;
    const displayTitle =
      hiredApps.find((a) => a.jobPost.title.trim().toLowerCase() === normTitle)?.jobPost.title ??
      normTitle;
    return {
      roleTitle: displayTitle,
      avgDaysToHire: Math.round(avgDays * 10) / 10,
      hireCount: roleApps.length,
    };
  });

  const byMonth = new Map<string, number[]>();
  for (const app of hiredApps) {
    const m = app.statusUpdatedAt;
    const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
    const days =
      (app.statusUpdatedAt.getTime() - app.submittedAt.getTime()) / (24 * 60 * 60 * 1000);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(days);
  }
  const trend = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthStr, days]) => {
      const [y, m] = monthStr.split("-").map(Number);
      const date = new Date(y, m - 1, 1);
      const label = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      const avgDays =
        days.length > 0 ? days.reduce((a, b) => a + b, 0) / days.length : 0;
      return { month: label, avgDaysToHire: Math.round(avgDays * 10) / 10 };
    });

  let platformBenchmark: StageDays | { benchmarkAvailable: false } = { benchmarkAvailable: false };
  if (hiredApps.length > 0) {
    const titleVariants = Array.from(new Set(hiredApps.map((a) => a.jobPost.title.trim().toLowerCase())));
    const platformHired = await prisma.jobApplication.findMany({
      where: {
        status: "OFFERED",
        statusUpdatedAt: { gte: since },
        jobPost: {
          companyId: { not: companyId },
          status: "ACTIVE",
        },
      },
      select: {
        submittedAt: true,
        statusUpdatedAt: true,
        applicationTimeline: true,
        jobPost: { select: { title: true, companyId: true } },
      },
    });
    const sameTitleApps = platformHired.filter((a) =>
      titleVariants.includes(a.jobPost.title.trim().toLowerCase())
    );
    const companyIds = new Set(sameTitleApps.map((a) => a.jobPost.companyId).filter(Boolean));
    if (sameTitleApps.length >= 5 && companyIds.size >= 3) {
      const platStageDays = sameTitleApps.map((app) => {
        const submitted = app.submittedAt;
        const offeredAt = app.statusUpdatedAt;
        const timeline = app.applicationTimeline as { status: string; at: string }[] | null;
        const firstView = getStageTimestamp(timeline, "UNDER_REVIEW");
        const shortlist = getStageTimestamp(timeline, "SHORTLISTED");
        const interview = getStageTimestamp(timeline, "INTERVIEW_SCHEDULED");
        return {
          daysToFirstView: firstView ? daysBetween(submitted, firstView) : null,
          daysToShortlist: shortlist ? daysBetween(submitted, shortlist) : null,
          daysToInterview: interview ? daysBetween(submitted, interview) : null,
          daysToOffer: offeredAt ? daysBetween(submitted, offeredAt) : null,
          daysToHire: offeredAt ? daysBetween(submitted, offeredAt) : null,
        };
      });
      platformBenchmark = {
        daysToFirstView: avg(platStageDays.map((s) => s.daysToFirstView), companyAvg.daysToFirstView),
        daysToShortlist: avg(platStageDays.map((s) => s.daysToShortlist), companyAvg.daysToShortlist),
        daysToInterview: avg(platStageDays.map((s) => s.daysToInterview), companyAvg.daysToInterview),
        daysToOffer: avg(platStageDays.map((s) => s.daysToOffer), companyAvg.daysToOffer),
        daysToHire: avg(platStageDays.map((s) => s.daysToHire), companyAvg.daysToHire),
      };
    }
  }

  return NextResponse.json({
    companyAvg,
    platformBenchmark,
    byRole,
    trend,
  });
}
