/**
 * BL-10: Career Milestones — shareable cards for contract completed, tier achieved.
 */

import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma/client";
import type { CareerMilestoneType } from "@prisma/client";

const SLUG_LENGTH = 8;

function generateSlug(): string {
  return randomBytes(SLUG_LENGTH)
    .toString("base64url")
    .slice(0, SLUG_LENGTH)
    .toLowerCase();
}

function firstName(name: string | null): string {
  if (!name?.trim()) return "A member";
  return name.trim().split(/\s+/)[0] ?? "A member";
}

export interface MilestoneCardData {
  slug: string;
  type: CareerMilestoneType;
  headline: string;
  subline?: string;
}

export async function createContractCompletedMilestone(
  contractId: string,
  menteeId: string
): Promise<{ ok: boolean; slug?: string; error?: string }> {
  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
    include: {
      mentor: { select: { name: true } },
      mentee: { select: { name: true } },
      outcome: { select: { transitionType: true } },
    },
  });
  if (!contract) return { ok: false, error: "Contract not found" };
  if (contract.menteeUserId !== menteeId) return { ok: false, error: "Forbidden" };
  if (contract.status !== "COMPLETED") return { ok: false, error: "Contract must be completed" };

  const existing = await prisma.careerMilestone.findFirst({
    where: { type: "CONTRACT_COMPLETED", entityId: contractId, userId: menteeId },
  });
  if (existing) return { ok: false, error: "Milestone already exists", slug: existing.slug };

  let slug = generateSlug();
  for (let i = 0; i < 5; i++) {
    const taken = await prisma.careerMilestone.findUnique({ where: { slug } });
    if (!taken) break;
    slug = generateSlug();
  }

  await prisma.careerMilestone.create({
    data: {
      type: "CONTRACT_COMPLETED",
      userId: menteeId,
      entityId: contractId,
      slug,
      metadata: {
        menteeFirstName: firstName(contract.mentee?.name ?? null),
        mentorFirstName: firstName(contract.mentor?.name ?? null),
        transitionType: contract.outcome?.transitionType ?? "mentorship",
      } as object,
    },
  });
  return { ok: true, slug };
}

export async function createTierAchievedMilestone(
  tierHistoryId: string,
  mentorId: string
): Promise<{ ok: boolean; slug?: string; error?: string }> {
  const history = await prisma.mentorTierHistory.findUnique({
    where: { id: tierHistoryId },
    include: { mentor: { select: { name: true } } },
  });
  if (!history) return { ok: false, error: "Tier history not found" };
  if (history.mentorId !== mentorId) return { ok: false, error: "Forbidden" };

  const existing = await prisma.careerMilestone.findFirst({
    where: { type: "TIER_ACHIEVED", entityId: tierHistoryId, userId: mentorId },
  });
  if (existing) return { ok: false, error: "Milestone already exists", slug: existing.slug };

  let slug = generateSlug();
  for (let i = 0; i < 5; i++) {
    const taken = await prisma.careerMilestone.findUnique({ where: { slug } });
    if (!taken) break;
    slug = generateSlug();
  }

  await prisma.careerMilestone.create({
    data: {
      type: "TIER_ACHIEVED",
      userId: mentorId,
      entityId: tierHistoryId,
      slug,
      metadata: {
        mentorFirstName: firstName(history.mentor?.name ?? null),
        newTier: history.newTier,
      } as object,
    },
  });
  return { ok: true, slug };
}

export async function getMilestoneBySlug(slug: string): Promise<MilestoneCardData | null> {
  const m = await prisma.careerMilestone.findUnique({ where: { slug } });
  if (!m) return null;
  const meta = m.metadata as Record<string, unknown>;
  if (m.type === "CONTRACT_COMPLETED") {
    return {
      slug: m.slug,
      type: "CONTRACT_COMPLETED",
      headline: `${meta.menteeFirstName ?? "A seeker"} completed a mentorship`,
      subline: meta.mentorFirstName
        ? `with ${meta.mentorFirstName} on Ascend`
        : "on Ascend",
    };
  }
  if (m.type === "TIER_ACHIEVED") {
    const tier = String(meta.newTier ?? "").toLowerCase();
    return {
      slug: m.slug,
      type: "TIER_ACHIEVED",
      headline: `${meta.mentorFirstName ?? "A mentor"} reached ${tier} tier`,
      subline: "on Ascend",
    };
  }
  return null;
}

export async function getEligibleContractMilestones(menteeId: string): Promise<
  Array<{ contractId: string; transitionType: string | null; hasMilestone: boolean }>
> {
  const contracts = await prisma.mentorshipContract.findMany({
    where: { menteeUserId: menteeId, status: "COMPLETED" },
    select: {
      id: true,
      outcome: { select: { transitionType: true } },
    },
  });
  const ids = contracts.map((c) => c.id);
  const milestones = await prisma.careerMilestone.findMany({
    where: { type: "CONTRACT_COMPLETED", entityId: { in: ids } },
    select: { entityId: true },
  });
  const hasSet = new Set(milestones.map((m) => m.entityId));
  return contracts.map((c) => ({
    contractId: c.id,
    transitionType: c.outcome?.transitionType ?? null,
    hasMilestone: hasSet.has(c.id),
  }));
}

export async function getEligibleTierMilestones(mentorId: string): Promise<
  Array<{ tierHistoryId: string; newTier: string; hasMilestone: boolean }>
> {
  const history = await prisma.mentorTierHistory.findMany({
    where: { mentorId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, newTier: true },
  });
  const ids = history.map((h) => h.id);
  const milestones = await prisma.careerMilestone.findMany({
    where: { type: "TIER_ACHIEVED", entityId: { in: ids } },
    select: { entityId: true },
  });
  const hasSet = new Set(milestones.map((m) => m.entityId));
  return history.map((h) => ({
    tierHistoryId: h.id,
    newTier: h.newTier,
    hasMilestone: hasSet.has(h.id),
  }));
}
