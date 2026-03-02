import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as { role?: string }).role;
    if (role !== "JOB_SEEKER") {
      return NextResponse.json({ scores: [] });
    }

    const records = await prisma.fitScore.findMany({
      where: { userId: session.user.id },
      orderBy: { computedAt: "desc" },
      take: 10,
      include: {
        jobPost: { select: { id: true, title: true, slug: true, companyName: true } },
      },
    });

    const historyByJob = await prisma.fitScoreHistory.findMany({
      where: {
        userId: session.user.id,
        jobPostId: { in: records.map((r) => r.jobPostId) },
      },
      orderBy: { recordedAt: "desc" },
      select: { jobPostId: true, overallScore: true, recordedAt: true },
    });

    const historyMap = new Map<number, { score: number; at: Date }[]>();
    for (const h of historyByJob) {
      const list = historyMap.get(h.jobPostId) ?? [];
      list.push({ score: h.overallScore, at: h.recordedAt });
      historyMap.set(h.jobPostId, list);
    }

    const scores = records.map((r) => {
      const prevScores = (historyMap.get(r.jobPostId) ?? [])
        .filter((x) => x.at.getTime() < r.computedAt.getTime())
        .slice(0, 1);
      const prev = prevScores[0];
      let trend: "up" | "down" | "stable" | null = null;
      if (prev) {
        if (r.overallScore > prev.score) trend = "up";
        else if (r.overallScore < prev.score) trend = "down";
        else trend = "stable";
      }
      return {
        jobPostId: r.jobPostId,
        jobTitle: r.jobPost.title,
        companyName: r.jobPost.companyName ?? null,
        slug: r.jobPost.slug,
        overallScore: r.overallScore,
        computedAt: r.computedAt.toISOString(),
        trend,
      };
    });

    return NextResponse.json({ scores });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch fit scores" }, { status: 500 });
  }
}
