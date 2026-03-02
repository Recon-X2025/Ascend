import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import type { PlanType } from "@prisma/client";
import { z } from "zod";

const bodySchema = z.object({
  planKey: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const sub = await prisma.userSubscription.findFirst({
    where: { OR: [{ id }, { userId: id }] },
  });
  if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });

  const update: { planKey: string; plan?: PlanType; expiresAt?: Date } = {
    planKey: parsed.data.planKey,
  };
  if (parsed.data.expiresAt) {
    update.expiresAt = new Date(parsed.data.expiresAt);
  }
  const legacyPlan = planKeyToLegacy(parsed.data.planKey);
  if (legacyPlan) update.plan = legacyPlan as PlanType;

  await prisma.userSubscription.update({
    where: { id: sub.id },
    data: update,
  });

  return NextResponse.json({ success: true });
}

function planKeyToLegacy(planKey: string): string | undefined {
  const map: Record<string, string> = {
    SEEKER_PAID: "SEEKER_PREMIUM",
    MENTOR_MARKETPLACE: "MENTOR_MARKETPLACE",
    RECRUITER_STARTER: "RECRUITER_STARTER",
    RECRUITER_PRO: "RECRUITER_PRO",
    RECRUITER_ENTERPRISE: "RECRUITER_ENTERPRISE",
  };
  return map[planKey];
}
