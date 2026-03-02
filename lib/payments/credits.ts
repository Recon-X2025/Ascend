/**
 * Phase 12: Resume optimisation credits (pay-per-use for SEEKER_FREE).
 */
import { prisma } from "@/lib/prisma/client";

export async function hasResumeOptimisationCredit(userId: string): Promise<boolean> {
  const row = await prisma.resumeOptimisationCredit.findUnique({
    where: { userId },
    select: { balance: true },
  });
  return (row?.balance ?? 0) > 0;
}

export async function deductResumeOptimisationCredit(userId: string): Promise<boolean> {
  const updated = await prisma.resumeOptimisationCredit.updateMany({
    where: { userId, balance: { gte: 1 } },
    data: { balance: { decrement: 1 } },
  });
  return updated.count > 0;
}

export async function addResumeOptimisationCredits(
  userId: string,
  count: number,
  paymentId?: string
): Promise<void> {
  await prisma.resumeOptimisationCredit.upsert({
    where: { userId },
    create: { userId, balance: count, paymentId },
    update: {
      balance: { increment: count },
      paymentId: paymentId ?? undefined,
    },
  });
}
