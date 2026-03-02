/**
 * M-12: Mentorship Circles (Group Cohorts).
 * One circle = one mentor capacity slot. Individual contracts + escrow per member.
 * Price ceiling 60% of 1:1 DEEP fee.
 */

import { z } from "zod";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma/client";
import { enforceCapacity, incrementActiveMenteeCount } from "./tiers";
import { initialiseEngagement } from "./engagement";
import { ENGAGEMENT_CONFIG } from "./engagement";
import { createContractForCircle } from "./contract";
import { DEFAULT_ESCROW_FEE_PAISE } from "@/lib/escrow/config";
import { logMentorshipAction } from "./audit";
import { trackOutcome } from "@/lib/tracking/outcomes";

export const CIRCLE_CONFIG = {
  MIN_MEMBERS: 2,
  MAX_MEMBERS: 8,
  DEFAULT_MAX_MEMBERS: 6,
  LEAD_TIME_DAYS_MIN: 7,
  LEAD_TIME_DAYS_MAX: 90,
  PRICE_CEILING_PCT: 0.6, // 60% of 1:1 DEEP fee
  ENGAGEMENT_TYPE: "DEEP" as const, // 90 days, 8 sessions, 3 milestones
} as const;

const DEEP_FEE_PAISE = DEFAULT_ESCROW_FEE_PAISE.DEEP;
const CIRCLE_FEE_CEILING_PAISE = Math.round(DEEP_FEE_PAISE * CIRCLE_CONFIG.PRICE_CEILING_PCT);

export const CreateCircleSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  maxMembers: z
    .number()
    .int()
    .min(CIRCLE_CONFIG.MIN_MEMBERS)
    .max(CIRCLE_CONFIG.MAX_MEMBERS)
    .default(CIRCLE_CONFIG.DEFAULT_MAX_MEMBERS),
  feePaise: z
    .number()
    .int()
    .min(1)
    .max(CIRCLE_FEE_CEILING_PAISE),
  startDate: z.coerce.date(),
  leadTimeDays: z
    .number()
    .int()
    .min(CIRCLE_CONFIG.LEAD_TIME_DAYS_MIN)
    .max(CIRCLE_CONFIG.LEAD_TIME_DAYS_MAX)
    .default(CIRCLE_CONFIG.LEAD_TIME_DAYS_MIN),
});

export const ApplyToCircleSchema = z.object({
  applicationNote: z.string().max(500).optional(),
});

export const AcceptCircleApplicationSchema = z.object({
  memberId: z.string().cuid(),
});

export const PeerCheckInSchema = z.object({
  toMemberId: z.string().cuid(),
  content: z.string().min(1).max(500),
});

export type CreateCircleInput = z.infer<typeof CreateCircleSchema>;
export type ApplyToCircleInput = z.infer<typeof ApplyToCircleSchema>;
export type AcceptCircleApplicationInput = z.infer<typeof AcceptCircleApplicationSchema>;
export type PeerCheckInInput = z.infer<typeof PeerCheckInSchema>;

/**
 * Create a mentorship circle. Validates capacity, ceiling, lead time.
 * One circle = 1 mentor slot.
 */
export async function createCircle(
  mentorId: string,
  input: CreateCircleInput
): Promise<{ id: string; status: string }> {
  const { canAcceptNewMentee } = await enforceCapacity(mentorId);
  if (!canAcceptNewMentee) {
    throw new Error("Mentor has reached max capacity. Cannot create new circle.");
  }

  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: mentorId },
  });
  if (!mentorProfile) throw new Error("Mentor profile not found");

  const minStart = addDays(new Date(), input.leadTimeDays);
  if (input.startDate < minStart) {
    throw new Error(
      `Start date must be at least ${input.leadTimeDays} days from now`
    );
  }

  const circle = await prisma.mentorshipCircle.create({
    data: {
      mentorId,
      mentorProfileId: mentorProfile.id,
      title: input.title,
      description: input.description,
      maxMembers: input.maxMembers,
      feePaise: input.feePaise,
      startDate: input.startDate,
      leadTimeDays: input.leadTimeDays,
      status: "DRAFT",
    },
  });

  await logMentorshipAction({
    actorId: mentorId,
    action: "CIRCLE_CREATED",
    category: "CONTRACT",
    entityType: "MentorshipCircle",
    entityId: circle.id,
    newState: { status: circle.status, maxMembers: input.maxMembers },
  });

  return { id: circle.id, status: circle.status };
}

/**
 * Open circle for applications.
 */
export async function openCircle(circleId: string, mentorId: string): Promise<void> {
  const circle = await prisma.mentorshipCircle.findUnique({
    where: { id: circleId },
  });
  if (!circle) throw new Error("Circle not found");
  if (circle.mentorId !== mentorId) throw new Error("Forbidden");
  if (circle.status !== "DRAFT") {
    throw new Error(`Cannot open circle in status ${circle.status}`);
  }

  await prisma.mentorshipCircle.update({
    where: { id: circleId },
    data: { status: "OPEN" },
  });

  await logMentorshipAction({
    actorId: mentorId,
    action: "CIRCLE_OPENED",
    category: "CONTRACT",
    entityType: "MentorshipCircle",
    entityId: circleId,
    newState: { status: "OPEN" },
  });
}

/**
 * Mentee applies to join a circle.
 */
export async function applyToCircle(
  circleId: string,
  menteeId: string,
  input: ApplyToCircleInput
): Promise<{ memberId: string }> {
  const circle = await prisma.mentorshipCircle.findUnique({
    where: { id: circleId },
    include: { members: true },
  });
  if (!circle) throw new Error("Circle not found");
  if (circle.status !== "OPEN") {
    throw new Error("Circle is not accepting applications");
  }

  const existing = circle.members.find((m) => m.menteeId === menteeId);
  if (existing) {
    throw new Error("Already applied to this circle");
  }

  if (circle.members.length >= circle.maxMembers) {
    throw new Error("Circle is full");
  }

  const member = await prisma.circleMember.create({
    data: {
      circleId,
      menteeId,
      status: "APPLIED",
      applicationNote: input.applicationNote,
    },
  });

  await logMentorshipAction({
    actorId: menteeId,
    action: "CIRCLE_APPLICATION_SUBMITTED",
    category: "CONTRACT",
    entityType: "CircleMember",
    entityId: member.id,
    newState: { status: "APPLIED" },
  });

  return { memberId: member.id };
}

/**
 * Mentor accepts a circle application. Creates contract for mentee.
 * Does NOT sign — mentee still needs to sign. Increments capacity when contract ACTIVE.
 */
export async function acceptCircleApplication(
  circleId: string,
  memberId: string,
  mentorId: string
): Promise<{ contractId: string }> {
  const circle = await prisma.mentorshipCircle.findUnique({
    where: { id: circleId },
    include: {
      members: true,
      mentorProfile: { include: { user: { select: { id: true } } } },
    },
  });
  if (!circle) throw new Error("Circle not found");
  if (circle.mentorId !== mentorId) throw new Error("Forbidden");
  if (circle.status !== "OPEN") {
    throw new Error("Circle is not accepting applications");
  }

  const member = circle.members.find((m) => m.id === memberId);
  if (!member) throw new Error("Member not found");
  if (member.status !== "APPLIED") {
    throw new Error(`Member status is ${member.status}, expected APPLIED`);
  }

  const confirmedCount = circle.members.filter(
    (m) => m.status === "ACCEPTED" || m.status === "CONFIRMED"
  ).length;
  if (confirmedCount >= circle.maxMembers) {
    throw new Error("Circle is full");
  }

  const contract = await createContractForCircle({
    mentorId,
    menteeId: member.menteeId,
    circleId,
    circleMemberId: member.id,
    agreedFeePaise: circle.feePaise,
  });

  await prisma.circleMember.update({
    where: { id: memberId },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  await logMentorshipAction({
    actorId: mentorId,
    action: "CIRCLE_APPLICATION_ACCEPTED",
    category: "CONTRACT",
    entityType: "CircleMember",
    entityId: memberId,
    newState: { status: "ACCEPTED", contractId: contract.id },
  });

  return { contractId: contract.id };
}

/**
 * Mentor declines a circle application.
 */
export async function declineCircleApplication(
  circleId: string,
  memberId: string,
  mentorId: string
): Promise<void> {
  const circle = await prisma.mentorshipCircle.findUnique({
    where: { id: circleId },
  });
  if (!circle) throw new Error("Circle not found");
  if (circle.mentorId !== mentorId) throw new Error("Forbidden");

  const member = await prisma.circleMember.findFirst({
    where: { id: memberId, circleId },
  });
  if (!member) throw new Error("Member not found");
  if (member.status !== "APPLIED") {
    throw new Error(`Member status is ${member.status}`);
  }

  await prisma.circleMember.update({
    where: { id: memberId },
    data: { status: "DECLINED" },
  });

  await logMentorshipAction({
    actorId: mentorId,
    action: "CIRCLE_APPLICATION_DECLINED",
    category: "CONTRACT",
    entityType: "CircleMember",
    entityId: memberId,
    newState: { status: "DECLINED" },
  });
}

/**
 * Mentee withdraws application.
 */
export async function withdrawCircleApplication(
  circleId: string,
  menteeId: string
): Promise<void> {
  const member = await prisma.circleMember.findFirst({
    where: { circleId, menteeId, status: "APPLIED" },
  });
  if (!member) throw new Error("Application not found or already processed");

  await prisma.circleMember.update({
    where: { id: member.id },
    data: { status: "WITHDRAWN" },
  });

  await logMentorshipAction({
    actorId: menteeId,
    action: "CIRCLE_APPLICATION_WITHDRAWN",
    category: "CONTRACT",
    entityType: "CircleMember",
    entityId: member.id,
    newState: { status: "WITHDRAWN" },
  });
}

/**
 * Lock circle — no more applications. Called when startDate <= now or manually.
 */
export async function lockCircle(circleId: string, mentorId: string): Promise<void> {
  const circle = await prisma.mentorshipCircle.findUnique({
    where: { id: circleId },
  });
  if (!circle) throw new Error("Circle not found");
  if (circle.mentorId !== mentorId) throw new Error("Forbidden");
  if (circle.status !== "OPEN") {
    throw new Error(`Cannot lock circle in status ${circle.status}`);
  }

  await prisma.mentorshipCircle.update({
    where: { id: circleId },
    data: { status: "LOCKED" },
  });

  await logMentorshipAction({
    actorId: mentorId,
    action: "CIRCLE_LOCKED",
    category: "CONTRACT",
    entityType: "MentorshipCircle",
    entityId: circleId,
    newState: { status: "LOCKED" },
  });
}

/**
 * Initialise circle engagement after lock: create CircleSessions, link member sessions,
 * initialise each member's engagement, increment activeMenteeCount by 1 (one circle = one slot).
 */
export async function initialiseCircleEngagement(
  circleId: string,
  mentorId?: string
): Promise<void> {
  const circle = await prisma.mentorshipCircle.findUnique({
    where: { id: circleId },
    include: {
      members: {
        where: { status: { in: ["ACCEPTED", "CONFIRMED"] } },
        include: { contract: true },
      },
      mentorProfile: true,
    },
  });
  if (!circle) throw new Error("Circle not found");
  if (mentorId && circle.mentorId !== mentorId) throw new Error("Forbidden");
  if (circle.status !== "LOCKED") {
    throw new Error(`Circle must be LOCKED to initialise. Status: ${circle.status}`);
  }

  const config = ENGAGEMENT_CONFIG.DEEP;

  // Create CircleSessions 1..8
  for (let i = 1; i <= config.sessions; i++) {
    await prisma.circleSession.create({
      data: {
        circleId,
        sessionNumber: i,
        status: "SCHEDULED",
      },
    });
  }

  // For each confirmed member with contract: initialise engagement
  for (const member of circle.members) {
    const contract = member.contract;
    if (!contract || contract.status !== "ACTIVE") continue;

    await initialiseEngagement(contract.id);

    // Link each EngagementSession to the corresponding CircleSession
    const sessions = await prisma.engagementSession.findMany({
      where: { contractId: contract.id },
      orderBy: { sessionNumber: "asc" },
    });
    const circleSessions = await prisma.circleSession.findMany({
      where: { circleId },
      orderBy: { sessionNumber: "asc" },
    });
    for (let i = 0; i < Math.min(sessions.length, circleSessions.length); i++) {
      await prisma.engagementSession.update({
        where: { id: sessions[i]!.id },
        data: { circleSessionId: circleSessions[i]!.id },
      });
    }
  }

  // One circle = 1 mentor slot
  await incrementActiveMenteeCount(circle.mentorId);

  await prisma.mentorshipCircle.update({
    where: { id: circleId },
    data: { status: "ACTIVE" },
  });

  await logMentorshipAction({
    actorId: circle.mentorId,
    action: "CIRCLE_ENGAGEMENT_INITIALISED",
    category: "CONTRACT",
    entityType: "MentorshipCircle",
    entityId: circleId,
    newState: { status: "ACTIVE", sessionCount: config.sessions },
  });
}

/**
 * Create or get session room for a circle session.
 */
export async function createCircleSessionRoom(circleSessionId: string): Promise<{
  roomId: string;
  dailyRoomName: string;
  dailyRoomUrl: string;
}> {
  const circleSession = await prisma.circleSession.findUnique({
    where: { id: circleSessionId },
    include: { sessionRoom: true },
  });
  if (!circleSession) throw new Error("Circle session not found");
  if (circleSession.sessionRoom) {
    return {
      roomId: circleSession.sessionRoom.id,
      dailyRoomName: circleSession.sessionRoom.dailyRoomName,
      dailyRoomUrl: circleSession.sessionRoom.dailyRoomUrl,
    };
  }

  const { getOrCreateCircleSessionRoom } = await import("@/lib/sessions/room");
  return getOrCreateCircleSessionRoom(circleSessionId);
}

/**
 * Create peer check-in between circle members.
 */
export async function createPeerCheckIn(
  circleId: string,
  fromMemberId: string,
  input: PeerCheckInInput
): Promise<{ id: string }> {
  const circle = await prisma.mentorshipCircle.findUnique({
    where: { id: circleId },
    include: { members: true },
  });
  if (!circle) throw new Error("Circle not found");

  const fromMember = circle.members.find((m) => m.id === fromMemberId);
  if (!fromMember) throw new Error("From member not found");
  const toMember = circle.members.find((m) => m.id === input.toMemberId);
  if (!toMember) throw new Error("To member not found");
  if (fromMemberId === input.toMemberId) throw new Error("Cannot check in with yourself");

  const checkIn = await prisma.circlePeerCheckIn.create({
    data: {
      circleId,
      fromMemberId,
      toMemberId: input.toMemberId,
      content: input.content,
    },
  });

  await trackOutcome(fromMember.menteeId, "M12_PEER_CHECK_IN", {
    entityId: checkIn.id,
    entityType: "CirclePeerCheckIn",
    metadata: { circleId, toMemberId: input.toMemberId },
  });

  return { id: checkIn.id };
}
