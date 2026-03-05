/**
 * BL-3: Transition Success Stories — consent-gated shareable cards from verified outcomes.
 */

import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma/client";
import { differenceInDays } from "date-fns";

const SLUG_LENGTH = 8;

function generateSlug(): string {
  return randomBytes(SLUG_LENGTH)
    .toString("base64url")
    .slice(0, SLUG_LENGTH)
    .toLowerCase();
}

/** First name only, no PII. */
function firstName(name: string | null): string {
  if (!name?.trim()) return "A seeker";
  const parts = name.trim().split(/\s+/);
  return parts[0] ?? "A seeker";
}

export interface SuccessStoryData {
  slug: string;
  menteeFirstName: string;
  transitionType: string;
  claimedOutcome: string;
  daysToComplete: number | null;
  mentorFirstName?: string;
  employer?: string; // only if includeEmployer
}

export async function createSuccessStory(
  outcomeId: string,
  menteeId: string,
  includeEmployer: boolean
): Promise<{ ok: boolean; slug?: string; error?: string }> {
  const outcome = await prisma.mentorshipOutcome.findUnique({
    where: { id: outcomeId },
    include: {
      successStory: true,
      contract: {
        select: { engagementStart: true, engagementEnd: true },
      },
      mentee: { select: { id: true, name: true } },
      mentor: { select: { name: true } },
    },
  });

  if (!outcome) return { ok: false, error: "Outcome not found" };
  if (outcome.menteeId !== menteeId) return { ok: false, error: "Forbidden" };
  if (outcome.status !== "VERIFIED") return { ok: false, error: "Outcome must be verified" };
  if (!outcome.testimonialConsent) return { ok: false, error: "Testimonial consent required" };
  if (outcome.successStory) return { ok: false, error: "Story already exists", slug: outcome.successStory.slug };

  let slug = generateSlug();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await prisma.transitionSuccessStory.findUnique({ where: { slug } });
    if (!existing) break;
    slug = generateSlug();
    attempts++;
  }

  await prisma.transitionSuccessStory.create({
    data: {
      outcomeId,
      slug,
      includeEmployer,
    },
  });

  return { ok: true, slug };
}

export async function getSuccessStoryBySlug(slug: string): Promise<SuccessStoryData | null> {
  const story = await prisma.transitionSuccessStory.findUnique({
    where: { slug },
    include: {
      outcome: {
        include: {
          contract: {
            select: { engagementStart: true, engagementEnd: true },
          },
          mentee: { select: { name: true } },
          mentor: { select: { name: true } },
        },
      },
    },
  });

  if (!story || !story.outcome) return null;

  const { outcome } = story;
  const engagementStart = outcome.contract?.engagementStart;
  const engagementEnd = outcome.contract?.engagementEnd;
  let daysToComplete: number | null = null;
  if (engagementStart && engagementEnd) {
    daysToComplete = Math.max(0, differenceInDays(engagementEnd, engagementStart));
  }

  let employer: string | undefined;
  if (story.includeEmployer) {
    const menteeProfile = await prisma.jobSeekerProfile.findUnique({
      where: { userId: outcome.menteeId },
      select: { currentCompany: true },
    });
    employer = menteeProfile?.currentCompany ?? undefined;
  }

  return {
    slug: story.slug,
    menteeFirstName: firstName(outcome.mentee?.name ?? null),
    transitionType: outcome.transitionType,
    claimedOutcome: outcome.claimedOutcome,
    daysToComplete,
    mentorFirstName: outcome.mentor?.name ? firstName(outcome.mentor.name) : undefined,
    employer,
  };
}

export async function getMyEligibleOutcomes(menteeId: string): Promise<
  Array<{
    outcomeId: string;
    transitionType: string;
    claimedOutcome: string;
    hasStory: boolean;
  }>
> {
  const outcomes = await prisma.mentorshipOutcome.findMany({
    where: {
      menteeId,
      status: "VERIFIED",
      testimonialConsent: true,
    },
    select: {
      id: true,
      transitionType: true,
      claimedOutcome: true,
      successStory: { select: { slug: true } },
    },
  });

  return outcomes.map((o) => ({
    outcomeId: o.id,
    transitionType: o.transitionType,
    claimedOutcome: o.claimedOutcome,
    hasStory: !!o.successStory,
  }));
}
