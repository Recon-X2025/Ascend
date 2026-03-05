/**
 * Phase 9 (BL-10) — Career Milestones: unit tests.
 */
import { prisma } from "@/lib/prisma/client";

jest.mock("@/lib/prisma/client", () => ({
  prisma: {
    mentorshipContract: { findUnique: jest.fn() },
    mentorTierHistory: { findUnique: jest.fn() },
    careerMilestone: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe("Career Milestones (BL-10)", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("createContractCompletedMilestone", () => {
    it("rejects when contract not found", async () => {
      (prisma.mentorshipContract.findUnique as jest.Mock).mockResolvedValue(null);
      const { createContractCompletedMilestone } = await import("@/lib/milestones/career");
      const result = await createContractCompletedMilestone("c1", "u1");
      expect(result).toEqual({ ok: false, error: "Contract not found" });
    });

    it("rejects when mentee does not own contract", async () => {
      (prisma.mentorshipContract.findUnique as jest.Mock).mockResolvedValue({
        id: "c1",
        menteeUserId: "other",
        status: "COMPLETED",
        mentor: { name: "Mentor" },
        mentee: { name: "Mentee" },
        outcome: { transitionType: "SWE → PM" },
      });
      const { createContractCompletedMilestone } = await import("@/lib/milestones/career");
      const result = await createContractCompletedMilestone("c1", "u1");
      expect(result).toEqual({ ok: false, error: "Forbidden" });
    });

    it("creates when eligible", async () => {
      (prisma.mentorshipContract.findUnique as jest.Mock).mockResolvedValue({
        id: "c1",
        menteeUserId: "u1",
        status: "COMPLETED",
        mentor: { name: "Alice" },
        mentee: { name: "Bob" },
        outcome: { transitionType: "SWE → PM" },
      });
      (prisma.careerMilestone.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.careerMilestone.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.careerMilestone.create as jest.Mock).mockResolvedValue({ slug: "abc123" });
      const { createContractCompletedMilestone } = await import("@/lib/milestones/career");
      const result = await createContractCompletedMilestone("c1", "u1");
      expect(result.ok).toBe(true);
      expect(result.slug).toBeDefined();
    });
  });

  describe("getMilestoneBySlug", () => {
    it("returns null when not found", async () => {
      (prisma.careerMilestone.findUnique as jest.Mock).mockResolvedValue(null);
      const { getMilestoneBySlug } = await import("@/lib/milestones/career");
      const result = await getMilestoneBySlug("xyz");
      expect(result).toBeNull();
    });
  });
});
