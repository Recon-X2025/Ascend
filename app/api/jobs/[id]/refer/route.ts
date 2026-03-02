import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { redis } from "@/lib/redis/client";

const bodySchema = z.object({
  referredName: z.string().min(1).max(200),
  referredEmail: z.string().email(),
});

const RATE_LIMIT_KEY_PREFIX = "refer:";
const RATE_LIMIT_WINDOW = 24 * 60 * 60; // 24 hours
const RATE_LIMIT_MAX = 10;

type Params = { params: Promise<{ id: string }> };

function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? null : n;
}

export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const jobId = parseId((await params).id);
  if (jobId == null) {
    return NextResponse.json({ success: false, error: "Invalid job id" }, { status: 400 });
  }
  const job = await prisma.jobPost.findUnique({
    where: { id: jobId },
    include: { companyRef: { select: { name: true, slug: true } } },
  });
  if (!job) {
    return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
  }
  if (job.status !== "ACTIVE") {
    return NextResponse.json({ success: false, error: "Job is not active" }, { status: 400 });
  }
  const visibility = (job as { visibility?: string }).visibility ?? "PUBLIC";
  if (visibility === "INTERNAL" && job.companyId) {
    const employee = await prisma.companyEmployee.findUnique({
      where: { userId_companyId: { userId: session.user.id, companyId: job.companyId } },
    });
    if (!employee) {
      return NextResponse.json({ success: false, error: "Only verified employees can refer for this job" }, { status: 403 });
    }
  }

  const key = `${RATE_LIMIT_KEY_PREFIX}${session.user.id}:${jobId}`;
  const count = await redis.incr(key).catch(() => 0);
  if (count === 1) await redis.expire(key, RATE_LIMIT_WINDOW).catch(() => {});
  if (count > RATE_LIMIT_MAX) {
    return NextResponse.json(
      { error: "You can send at most 10 referrals per job per 24 hours.", code: "RATE_LIMIT" },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { referredName, referredEmail } = parsed.data;

  const referral = await prisma.jobReferral.create({
    data: {
      referrerId: session.user.id,
      referredEmail: referredEmail.toLowerCase(),
      jobPostId: jobId,
      updatedAt: new Date(),
    },
  });

  const referrerName = session.user.name ?? "A colleague";
  const companyName = job.companyRef?.name ?? job.companyName ?? "Company";
  const jobTitle = job.title;
  const jobSlug = job.slug;
  const workMode = job.workMode.replace(/_/g, " ");
  const location = job.locations?.[0] ?? "India";
  let salaryRange = "";
  if (job.salaryVisible && (job.salaryMin != null || job.salaryMax != null)) {
    const sym = job.salaryCurrency === "INR" ? "₹" : job.salaryCurrency === "USD" ? "$" : "";
    const min = job.salaryMin != null ? (job.salaryCurrency === "INR" ? job.salaryMin / 100000 : job.salaryMin) : null;
    const max = job.salaryMax != null ? (job.salaryCurrency === "INR" ? job.salaryMax / 100000 : job.salaryMax) : null;
    salaryRange = min != null && max != null ? `Salary: ${sym}${min}–${max} LPA.` : "";
  }
  const downloadUrl = `${process.env.NEXTAUTH_URL ?? ""}/jobs/${jobSlug}?ref=${referral.id}`;

  try {
    const { sendJobReferralEmail } = await import("@/lib/email/templates/job-referral");
    await sendJobReferralEmail({
      to: referredEmail,
      referredName,
      referrerName,
      jobTitle,
      companyName,
      downloadUrl,
      workMode,
      location,
      salaryRange,
    });
  } catch (e) {
    console.error("[refer] email error:", e);
  }

  trackOutcome(session.user.id, "JOB_REFERRAL_SENT", {
    entityType: "JobReferral",
    entityId: referral.id,
    metadata: { jobPostId: jobId, referredEmail: referredEmail.toLowerCase() },
  }).catch(() => {});

  return NextResponse.json({ success: true, referralId: referral.id });
}
