import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { createOrder } from "@/lib/payments";
import type { Currency } from "@/lib/payments/types";
import { BOOST_PRICE_PAISE } from "@/lib/payments/pricing";
import { canManageJob } from "@/lib/jobs/permissions";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  boostType: z.enum(["standard", "featured", "urgent"]),
  weeks: z.number().int().min(1).max(52).default(1),
  currency: z.enum(["INR", "USD"]).optional(),
});

export async function POST(req: Request, { params }: Params) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id: idParam } = await params;
  const jobId = parseInt(idParam, 10);
  if (Number.isNaN(jobId)) return NextResponse.json({ success: false, error: "Invalid job id" }, { status: 400 });

  const job = await prisma.jobPost.findUnique({
    where: { id: jobId },
    select: { companyId: true },
  });
  if (!job) return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
  if (!(await canManageJob(userId, jobId))) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const companyId = job.companyId;
  if (!companyId) return NextResponse.json({ success: false, error: "Job must be linked to a company" }, { status: 400 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });

  const { boostType, weeks, currency = "INR" } = parsed.data;
  const amount = (BOOST_PRICE_PAISE[boostType] ?? BOOST_PRICE_PAISE.standard) * weeks;

  const result = await createOrder({
    amount,
    currency: currency as Currency,
    receipt: `boost-${jobId}-${boostType}-${weeks}`,
    notes: { type: "boost", jobPostId: String(jobId), boostType, weeks: String(weeks), companyId },
  });

  return NextResponse.json({
    orderId: result.orderId,
    amount: result.amount,
    currency: result.currency,
    gateway: result.gateway,
    key: process.env.RAZORPAY_KEY_ID ?? undefined,
    metadata: { type: "boost", jobPostId: jobId, boostType, weeks, companyId },
  });
}
