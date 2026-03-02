import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { subDays } from "date-fns";

function pctChange(curr: number, prev: number): string {
  if (prev === 0) return curr > 0 ? "+100%" : "0%";
  const pct = ((curr - prev) / prev) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const latest = await prisma.investorSnapshot.findFirst({
    orderBy: { snapshotDate: "desc" },
  });
  if (!latest) {
    return NextResponse.json({
      current: null,
      vsLastWeek: null,
      vsLastMonth: null,
    });
  }

  const weekAgo = subDays(latest.snapshotDate, 7);
  const monthAgo = subDays(latest.snapshotDate, 30);

  const [prevWeek, prevMonth] = await Promise.all([
    prisma.investorSnapshot.findFirst({
      where: { snapshotDate: { lte: weekAgo } },
      orderBy: { snapshotDate: "desc" },
    }),
    prisma.investorSnapshot.findFirst({
      where: { snapshotDate: { lte: monthAgo } },
      orderBy: { snapshotDate: "desc" },
    }),
  ]);

  const toJson = (s: typeof latest) =>
    s
      ? {
          snapshotDate: s.snapshotDate.toISOString(),
          totalUsers: s.totalUsers,
          newUsersToday: s.newUsersToday,
          dau: s.dau,
          wau: s.wau,
          mau: s.mau,
          dauMauRatio: s.dauMauRatio,
          activeSeekers: s.activeSeekers,
          profileCompletionAvg: s.profileCompletionAvg,
          resumesGenerated: s.resumesGenerated,
          applicationsSubmitted: s.applicationsSubmitted,
          activeCompanies: s.activeCompanies,
          activeRecruiters: s.activeRecruiters,
          jobPostsActive: s.jobPostsActive,
          avgApplicantsPerJob: s.avgApplicantsPerJob,
          mentorsVerified: s.mentorsVerified,
          activeEngagements: s.activeEngagements,
          verifiedOutcomes: s.verifiedOutcomes,
          outcomeVerificationRate: s.outcomeVerificationRate,
          mrrInr: s.mrrInr,
          mrrUsd: s.mrrUsd,
          arpu: s.arpu,
          payingUsers: s.payingUsers,
          churnRate: s.churnRate,
          ltv: s.ltv,
          referralConversionRate: s.referralConversionRate,
          viralCoefficient: s.viralCoefficient,
          organicSignupRate: s.organicSignupRate,
          aiInteractionsToday: s.aiInteractionsToday,
          aiInteractions30d: s.aiInteractions30d,
          resumeOptimisations: s.resumeOptimisations,
          fitScoresComputed: s.fitScoresComputed,
        }
      : null;

  const current = toJson(latest);
  const vsLastWeek =
    current && prevWeek
      ? {
          dau: pctChange(latest.dau, prevWeek.dau),
          mau: pctChange(latest.mau, prevWeek.mau),
          mrrInr: pctChange(latest.mrrInr, prevWeek.mrrInr),
          payingUsers: `${latest.payingUsers - prevWeek.payingUsers >= 0 ? "+" : ""}${latest.payingUsers - prevWeek.payingUsers}`,
          verifiedOutcomes: `${latest.verifiedOutcomes - prevWeek.verifiedOutcomes >= 0 ? "+" : ""}${latest.verifiedOutcomes - prevWeek.verifiedOutcomes}`,
          churnRate: pctChange(latest.churnRate, prevWeek.churnRate),
          viralCoefficient: (latest.viralCoefficient - prevWeek.viralCoefficient).toFixed(2),
        }
      : null;

  const vsLastMonth =
    current && prevMonth
      ? {
          mrrInr: pctChange(latest.mrrInr, prevMonth.mrrInr),
          mau: pctChange(latest.mau, prevMonth.mau),
          payingUsers: `${latest.payingUsers - prevMonth.payingUsers >= 0 ? "+" : ""}${latest.payingUsers - prevMonth.payingUsers}`,
        }
      : null;

  return NextResponse.json({
    current,
    vsLastWeek,
    vsLastMonth,
  });
}
