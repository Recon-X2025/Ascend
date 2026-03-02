import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const sub = await prisma.userSubscription.findUnique({
    where: { userId },
    select: {
      plan: true,
      status: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      gateway: true,
    },
  });

  if (!sub) {
    return NextResponse.json({ subscription: null, plan: "FREE" });
  }

  return NextResponse.json({
    subscription: {
      plan: sub.plan,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      gateway: sub.gateway,
    },
    plan: sub.status === "ACTIVE" ? sub.plan : "FREE",
  });
}
