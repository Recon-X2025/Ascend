import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { subDays } from "date-fns";
import type { UserPersona } from "@prisma/client";

const PERSONAS: UserPersona[] = ["ACTIVE_SEEKER", "PASSIVE_SEEKER", "EARLY_CAREER", "RECRUITER"];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const days = Math.min(90, Math.max(1, parseInt(req.nextUrl.searchParams.get("days") ?? "30", 10)));
  const since = subDays(new Date(), days);

  const totalUsers = await prisma.user.count();
  const byPersona = await prisma.user.groupBy({
    by: ["persona"],
    where: { persona: { not: null } },
    _count: true,
  });

  const result: Record<string, { count: number; avgCompletionScore: number; avgSessionsPerUser: number; avgJobApplications: number; retentionRate7d: number; retentionRate30d: number; topFeatures: string[] }> = {};

  for (const persona of PERSONAS) {
    const count = byPersona.find((g) => g.persona === persona)?._count ?? 0;
    const userIds = await prisma.user.findMany({ where: { persona }, select: { id: true } }).then((u) => u.map((x) => x.id));

    const [avgCompletion, avgApplications, eventCounts, retention7, retention30] = await Promise.all([
      userIds.length > 0
        ? prisma.userCareerContext.aggregate({ where: { userId: { in: userIds } }, _avg: { completionScore: true } }).then((a) => a._avg.completionScore ?? 0)
        : 0,
      userIds.length > 0
        ? prisma.jobApplication.groupBy({ by: ["applicantId"], where: { applicantId: { in: userIds } }, _count: true }).then((g) => {
            const total = g.reduce((s, x) => s + x._count, 0);
            return userIds.length ? total / userIds.length : 0;
          })
        : 0,
      userIds.length > 0
        ? prisma.analyticsEvent.groupBy({ by: ["event"], where: { userId: { in: userIds }, createdAt: { gte: since } }, _count: true })
        : [],
      userIds.length > 0 ? prisma.analyticsEvent.findMany({ where: { userId: { in: userIds } }, select: { userId: true, createdAt: true }, take: 10000 }).then((events) => {
        const weekAgo = subDays(new Date(), 7);
        const byUser = new Map<string, { first: Date; last: Date }>();
        for (const e of events) {
          if (!e.userId) continue;
          const cur = byUser.get(e.userId);
          if (!cur) byUser.set(e.userId, { first: e.createdAt, last: e.createdAt });
          else {
            if (e.createdAt < cur.first) cur.first = e.createdAt;
            if (e.createdAt > cur.last) cur.last = e.createdAt;
          }
        }
        let returned = 0;
        Array.from(byUser.values()).forEach((v) => {
          if (v.first < weekAgo && v.last >= weekAgo) returned++;
        });
        return byUser.size > 0 ? (returned / byUser.size) * 100 : 0;
      })
      : 0,
      userIds.length > 0 ? prisma.analyticsEvent.findMany({ where: { userId: { in: userIds } }, select: { userId: true, createdAt: true }, take: 10000 }).then((events) => {
        const monthAgo = subDays(new Date(), 30);
        const byUser = new Map<string, { first: Date; last: Date }>();
        for (const e of events) {
          if (!e.userId) continue;
          const cur = byUser.get(e.userId);
          if (!cur) byUser.set(e.userId, { first: e.createdAt, last: e.createdAt });
          else {
            if (e.createdAt < cur.first) cur.first = e.createdAt;
            if (e.createdAt > cur.last) cur.last = e.createdAt;
          }
        }
        let returned = 0;
        Array.from(byUser.values()).forEach((v) => {
          if (v.first < monthAgo && v.last >= monthAgo) returned++;
        });
        return byUser.size > 0 ? (returned / byUser.size) * 100 : 0;
      })
      : 0,
    ]);

    const topEvents = (Array.isArray(eventCounts) ? eventCounts : []).sort((a, b) => b._count - a._count).slice(0, 5).map((e) => e.event);

    result[persona] = {
      count,
      avgCompletionScore: Math.round((avgCompletion ?? 0) * 10) / 10,
      avgSessionsPerUser: 0,
      avgJobApplications: Math.round((avgApplications ?? 0) * 10) / 10,
      retentionRate7d: Math.round((retention7 ?? 0) * 10) / 10,
      retentionRate30d: Math.round((retention30 ?? 0) * 10) / 10,
      topFeatures: topEvents,
    };
  }

  return NextResponse.json({ personas: result, totalUsers });
}
