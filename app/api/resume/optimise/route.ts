import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { enqueueOptimisation } from "@/lib/queues/jd-optimiser.queue";
import { isEnabled } from "@/lib/feature-flags";
import { canUseFeature, getUserPlan } from "@/lib/payments/gate";
import { getLimits } from "@/lib/payments/plans";
import { hasResumeOptimisationCredit, deductResumeOptimisationCredit } from "@/lib/payments/credits";
import { isPilotFreeOverride } from "@/lib/payments/plans";
import { z } from "zod";

const schema = z.object({
  jobPostId: z.union([z.string(), z.number()]).transform((v) => (typeof v === "string" ? parseInt(v, 10) : v)),
  baseVersionId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isEnabled("resume_optimiser_enabled"))) {
    return NextResponse.json({ error: "Feature not available" }, { status: 503 });
  }

  if (!isPilotFreeOverride()) {
    const plan = await getUserPlan(userId);
    const limits = getLimits(plan);
    const resumeLimit = limits.resumeOptimisationsPerMonth;

    if (resumeLimit === -1) {
      // Unlimited: proceed
    } else if (resumeLimit === 0) {
      // Pay-per-use: check credits
      const hasCredit = await hasResumeOptimisationCredit(userId);
      if (!hasCredit) {
        return NextResponse.json(
          {
            error: "No resume optimisation credits. Purchase one to continue.",
            code: "PAY_PER_USE_REQUIRED",
            pricePaise: 9900,
            purchaseUrl: "/resume/optimise/purchase",
          },
          { status: 402 }
        );
      }
    } else {
      // Monthly quota (resumeLimit > 0)
      const { allowed: gateAllowed } = await canUseFeature(userId, "resumeOptimisationsPerMonth");
      if (!gateAllowed) {
        return NextResponse.json(
          { error: "Upgrade to Premium to use the resume optimiser", code: "UPGRADE_REQUIRED" },
          { status: 402 }
        );
      }
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const count = await prisma.optimisationSession.count({
        where: { userId, createdAt: { gte: startOfMonth } },
      });
      if (count >= resumeLimit) {
        return NextResponse.json(
          {
            error: "Monthly optimiser limit reached. Upgrade for more.",
            code: "LIMIT_EXCEEDED",
            purchaseUrl: "/resume/optimise/purchase",
          },
          { status: 402 }
        );
      }
    }
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { jobPostId, baseVersionId } = parsed.data;

  const baseVersion = await prisma.resumeVersion.findFirst({
    where: { id: baseVersionId, userId },
  });
  if (!baseVersion) {
    return NextResponse.json({ error: "Resume version not found" }, { status: 404 });
  }

  const jobPost = await prisma.jobPost.findFirst({
    where: { id: jobPostId, status: "ACTIVE" },
  });
  if (!jobPost) {
    return NextResponse.json({ error: "Job post not found" }, { status: 404 });
  }

  const existing = await prisma.optimisationSession.findFirst({
    where: {
      userId,
      jobPostId,
      baseVersionId,
      status: { in: ["PENDING", "PROCESSING"] },
    },
  });
  if (existing) {
    return NextResponse.json({
      sessionId: existing.id,
      status: existing.status,
    });
  }

  // Deduct credit for pay-per-use (resumeLimit === 0) when not in pilot
  if (!isPilotFreeOverride()) {
    const plan = await getUserPlan(userId);
    const limits = getLimits(plan);
    if (limits.resumeOptimisationsPerMonth === 0) {
      const deducted = await deductResumeOptimisationCredit(userId);
      if (!deducted) {
        return NextResponse.json(
          {
            error: "No resume optimisation credits. Purchase one to continue.",
            code: "PAY_PER_USE_REQUIRED",
            purchaseUrl: "/resume/optimise/purchase",
          },
          { status: 402 }
        );
      }
    }
  }

  const optimSession = await prisma.optimisationSession.create({
    data: {
      userId,
      jobPostId,
      baseVersionId,
      status: "PENDING",
    },
  });

  await enqueueOptimisation({
    sessionId: optimSession.id,
    userId,
    jobPostId,
    baseVersionId,
  });

  return NextResponse.json(
    { sessionId: optimSession.id, status: "PENDING" },
    { status: 202 }
  );
}
