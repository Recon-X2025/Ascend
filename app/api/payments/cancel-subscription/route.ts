import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userSub = await prisma.userSubscription.findUnique({
    where: { userId },
    select: { id: true, cancelAtPeriodEnd: true },
  });

  if (!userSub) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 });
  }

  await prisma.userSubscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: true },
  });

  return NextResponse.json({ success: true, cancelAtPeriodEnd: true });
}
