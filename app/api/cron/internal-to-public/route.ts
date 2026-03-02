import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { logAudit } from "@/lib/audit/log";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { indexJob } from "@/lib/search/sync/jobs";
import { getCompanyRatingAggregate } from "@/lib/companies/ratings";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const now = new Date();
  const jobs = await prisma.jobPost.findMany({
    where: {
      visibility: "INTERNAL",
      status: "ACTIVE",
      internalFirstDays: { not: null },
    },
    include: {
      companyRef: { select: { slug: true, verified: true } },
      skills: { include: { skill: { select: { name: true } } } },
    },
  });
  const toSwitch = jobs.filter((j) => {
    const days = j.internalFirstDays ?? 0;
    if (days < 1 || days > 30) return false;
    const deadline = new Date(j.createdAt.getTime() + days * 24 * 60 * 60 * 1000);
    return deadline <= now;
  });
  for (const job of toSwitch) {
    await prisma.jobPost.update({
      where: { id: job.id },
      data: { visibility: "PUBLIC", internalFirstDays: null },
    });
    const companyRating = job.companyId ? await getCompanyRatingAggregate(job.companyId) : null;
    indexJob(
      { ...job, visibility: "PUBLIC", internalFirstDays: null, companyRef: job.companyRef ?? undefined, skills: job.skills },
      companyRating?.overallAvg ?? null
    );
    logAudit({
      category: "SYSTEM",
      action: "JOB_VISIBILITY_AUTO_SWITCHED",
      severity: "INFO",
      targetType: "JobPost",
      targetId: String(job.id),
      metadata: { jobId: job.id, from: "INTERNAL", to: "PUBLIC" },
    }).catch(() => {});
    if (job.recruiterId) {
      trackOutcome(job.recruiterId, "JOB_VISIBILITY_SWITCHED", {
        entityId: String(job.id),
        entityType: "JobPost",
        metadata: { jobId: job.id, from: "INTERNAL", to: "PUBLIC" },
      }).catch(() => {});
    }
  }
  return NextResponse.json({ switched: toSwitch.length, jobIds: toSwitch.map((j) => j.id) });
}
