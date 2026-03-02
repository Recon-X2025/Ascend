/**
 * M-8: Session rhythm & milestone framework.
 * Initialises engagement when contract becomes ACTIVE (both parties signed).
 */

import { prisma } from "@/lib/prisma/client";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { addDays } from "date-fns";

export const ENGAGEMENT_CONFIG = {
  SPRINT: { days: 30, sessions: 4, milestones: ["FINAL" as const] },
  STANDARD: { days: 60, sessions: 6, milestones: ["MID" as const, "FINAL" as const] },
  DEEP: { days: 90, sessions: 8, milestones: ["MID" as const, "MID" as const, "FINAL" as const] },
} as const;

/**
 * Called when ContractStatus → ACTIVE (both parties signed).
 * Creates sessions, milestones (including Goal Setting for session 1), sets engagement window.
 */
export async function initialiseEngagement(contractId: string): Promise<void> {
  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
    select: { id: true, engagementType: true, mentorUserId: true, menteeUserId: true },
  });
  if (!contract) throw new Error("Contract not found");
  const config = ENGAGEMENT_CONFIG[contract.engagementType as keyof typeof ENGAGEMENT_CONFIG];
  if (!config) throw new Error(`Unknown engagement type: ${contract.engagementType}`);

  const start = new Date();
  const end = addDays(start, config.days);

  await prisma.mentorshipContract.update({
    where: { id: contractId },
    data: { engagementStart: start, engagementEnd: end },
  });

  // Sessions 1..N, all SCHEDULED, no scheduledAt yet
  await prisma.engagementSession.createMany({
    data: Array.from({ length: config.sessions }, (_, i) => ({
      contractId,
      sessionNumber: i + 1,
      status: "SCHEDULED" as const,
    })),
  });

  // Goal Setting milestone: due within 7 days of start (session 1)
  const goalDue = addDays(start, 7);
  await prisma.engagementMilestone.create({
    data: {
      contractId,
      milestoneNumber: 1,
      type: "GOAL_SETTING",
      dueDate: goalDue,
      status: "PENDING",
    },
  });

  // Mid / Final milestones: Sprint FINAL day 28; Standard MID 28, FINAL 56; Deep MID 28, MID 56, FINAL 84
  const dueDaysByType: Record<string, number[]> = {
    SPRINT: [28],
    STANDARD: [28, 56],
    DEEP: [28, 56, 84],
  };
  const daysArr = dueDaysByType[contract.engagementType] ?? [28];
  for (let i = 0; i < config.milestones.length; i++) {
    const dueDate = addDays(start, daysArr[i] ?? 28);
    await prisma.engagementMilestone.create({
      data: {
        contractId,
        milestoneNumber: i + 2, // 1 is Goal Setting
        type: config.milestones[i],
        dueDate,
        status: "PENDING",
      },
    });
  }

  await trackOutcome(contract.mentorUserId, "M8_ENGAGEMENT_INITIALISED", {
    entityId: contractId,
    entityType: "MentorshipContract",
    metadata: {
      contractId,
      engagementType: contract.engagementType,
      sessionCount: config.sessions,
    },
  });
  await trackOutcome(contract.menteeUserId, "M8_ENGAGEMENT_INITIALISED", {
    entityId: contractId,
    entityType: "MentorshipContract",
    metadata: {
      contractId,
      engagementType: contract.engagementType,
      sessionCount: config.sessions,
    },
  });

  // M-6: Link escrow tranches to milestones once they exist
  try {
    const { linkEscrowTranchesToMilestones } = await import("@/lib/escrow");
    await linkEscrowTranchesToMilestones(contractId);
  } catch (e) {
    console.error("[engagement] linkEscrowTranchesToMilestones failed:", e);
  }

  const contractWithParties = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
    include: {
      mentor: { select: { email: true, name: true } },
      mentee: { select: { email: true, name: true } },
    },
  });
  if (contractWithParties?.mentor.email && contractWithParties?.mentee.email) {
    const baseUrl = process.env.NEXTAUTH_URL ?? "";
    const { sendEngagementStarted } = await import(
      "@/lib/email/templates/mentorship/engagement-started"
    );
    await sendEngagementStarted({
      mentorEmail: contractWithParties.mentor.email,
      menteeEmail: contractWithParties.mentee.email,
      mentorName: contractWithParties.mentor.name ?? "Mentor",
      menteeName: contractWithParties.mentee.name ?? "Mentee",
      engagementType: contract.engagementType,
      sessionCount: config.sessions,
      engagementUrl: `${baseUrl}/mentorship/engagements/${contractId}`,
    });
  }
}
