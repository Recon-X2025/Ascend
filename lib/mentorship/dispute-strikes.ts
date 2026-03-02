/**
 * M-9: Strike counts for dispute resolution.
 * Extracted to avoid pulling BullMQ into client bundles (monetisation → TierReputationCard).
 */

import { prisma } from "@/lib/prisma/client";

export async function getMenteeStrikeCount(userId: string): Promise<number> {
  return prisma.disputeStrike.count({
    where: { userId, strikeType: "MENTEE_DISPUTE_REJECTED" },
  });
}

export async function getMentorUpheldCount(mentorId: string): Promise<number> {
  const contractIds = await prisma.mentorshipContract.findMany({
    where: { mentorUserId: mentorId },
    select: { id: true },
  });
  const cids = contractIds.map((c) => c.id);
  if (cids.length === 0) return 0;

  return prisma.disputeStrike.count({
    where: {
      strikeType: "MENTOR_DISPUTE_UPHELD",
      dispute: { contractId: { in: cids } },
    },
  });
}
