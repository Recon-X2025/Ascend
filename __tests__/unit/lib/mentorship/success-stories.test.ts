/**
 * Phase 8 (BL-3) — Transition Success Stories: unit tests.
 */
import { prisma } from "@/lib/prisma/client";

jest.mock("@/lib/prisma/client", () => ({
  prisma: {
    mentorshipOutcome: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    transitionSuccessStory: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    jobSeekerProfile: { findUnique: jest.fn() },
  },
}));

describe("Transition Success Stories (BL-3)", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("createSuccessStory", () => {
    it("rejects when outcome not found", async () => {
      (prisma.mentorshipOutcome.findUnique as jest.Mock).mockResolvedValue(null);
      const { createSuccessStory } = await import("@/lib/mentorship/success-stories");
      const result = await createSuccessStory("outcome-1", "mentee-1", false);
      expect(result).toEqual({ ok: false, error: "Outcome not found" });
    });

    it("rejects when mentee does not own outcome", async () => {
      (prisma.mentorshipOutcome.findUnique as jest.Mock).mockResolvedValue({
        id: "o1",
        menteeId: "other-mentee",
        status: "VERIFIED",
        testimonialConsent: true,
        successStory: null,
      });
      const { createSuccessStory } = await import("@/lib/mentorship/success-stories");
      const result = await createSuccessStory("outcome-1", "mentee-1", false);
      expect(result).toEqual({ ok: false, error: "Forbidden" });
    });

    it("rejects when outcome not verified", async () => {
      (prisma.mentorshipOutcome.findUnique as jest.Mock).mockResolvedValue({
        id: "o1",
        menteeId: "mentee-1",
        status: "PENDING_MENTEE",
        testimonialConsent: true,
        successStory: null,
      });
      const { createSuccessStory } = await import("@/lib/mentorship/success-stories");
      const result = await createSuccessStory("outcome-1", "mentee-1", false);
      expect(result).toEqual({ ok: false, error: "Outcome must be verified" });
    });

    it("creates story when eligible", async () => {
      (prisma.mentorshipOutcome.findUnique as jest.Mock).mockResolvedValue({
        id: "o1",
        menteeId: "mentee-1",
        status: "VERIFIED",
        testimonialConsent: true,
        successStory: null,
      });
      (prisma.transitionSuccessStory.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.transitionSuccessStory.create as jest.Mock).mockResolvedValue({
        id: "s1",
        slug: "abc123xy",
        outcomeId: "o1",
      });
      const { createSuccessStory } = await import("@/lib/mentorship/success-stories");
      const result = await createSuccessStory("outcome-1", "mentee-1", false);
      expect(result.ok).toBe(true);
      expect(result.slug).toBeDefined();
      expect(prisma.transitionSuccessStory.create).toHaveBeenCalledWith({
        data: {
          outcomeId: "outcome-1",
          slug: expect.any(String),
          includeEmployer: false,
        },
      });
    });
  });

  describe("getSuccessStoryBySlug", () => {
    it("returns null when story not found", async () => {
      (prisma.transitionSuccessStory.findUnique as jest.Mock).mockResolvedValue(null);
      const { getSuccessStoryBySlug } = await import("@/lib/mentorship/success-stories");
      const result = await getSuccessStoryBySlug("xyz");
      expect(result).toBeNull();
    });
  });

  describe("getMyEligibleOutcomes", () => {
    it("returns only verified outcomes with testimonial consent", async () => {
      (prisma.mentorshipOutcome.findMany as jest.Mock).mockResolvedValue([
        { id: "o1", transitionType: "SWE → PM", claimedOutcome: "Got the role", successStory: null },
      ]);
      const { getMyEligibleOutcomes } = await import("@/lib/mentorship/success-stories");
      const result = await getMyEligibleOutcomes("mentee-1");
      expect(result).toHaveLength(1);
      expect(result[0].transitionType).toBe("SWE → PM");
      expect(result[0].hasStory).toBe(false);
    });
  });
});
