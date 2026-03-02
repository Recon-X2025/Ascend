import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

const MAX_IDS = 20;

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as { role?: string }).role;
    if (role !== "JOB_SEEKER") {
      return NextResponse.json({ error: "Fit scores are for job seekers" }, { status: 403 });
    }

    const url = new URL(req.url);
    const jobIdsParam = url.searchParams.get("jobIds");
    if (!jobIdsParam) {
      return NextResponse.json({});
    }
    const rawIds = jobIdsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, MAX_IDS);
    const jobIds = rawIds
      .map((id) => parseInt(id, 10))
      .filter((n) => !Number.isNaN(n));

    if (jobIds.length === 0) {
      return NextResponse.json({});
    }

    const rows = await prisma.fitScore.findMany({
      where: {
        userId: session.user.id,
        jobPostId: { in: jobIds },
        expiresAt: { gt: new Date() },
      },
      select: { jobPostId: true, overallScore: true },
    });

    const result: Record<string, { overallScore: number; cached: boolean }> = {};
    for (const row of rows) {
      result[String(row.jobPostId)] = { overallScore: row.overallScore, cached: true };
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to fetch fit scores" }, { status: 500 });
  }
}
