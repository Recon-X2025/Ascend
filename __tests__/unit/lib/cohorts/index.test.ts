/**
 * Phase 10 (BL-9) — Cohort Communities: unit tests.
 */
import { prisma } from "@/lib/prisma/client";

jest.mock("@/lib/prisma/client", () => ({
  prisma: {
    cohort: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    cohortMember: { upsert: jest.fn(), deleteMany: jest.fn(), findUnique: jest.fn() },
    cohortThread: { create: jest.fn(), findMany: jest.fn() },
  },
}));

describe("Cohorts (BL-9)", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("listCohorts", () => {
    it("returns cohorts with counts", async () => {
      (prisma.cohort.findMany as jest.Mock).mockResolvedValue([
        { id: "c1", name: "SWE → PM", _count: { members: 5, threads: 2 } },
      ]);
      const { listCohorts } = await import("@/lib/cohorts");
      const result = await listCohorts();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("SWE → PM");
    });
  });

  describe("joinCohort", () => {
    it("calls upsert", async () => {
      (prisma.cohortMember.upsert as jest.Mock).mockResolvedValue({});
      const { joinCohort } = await import("@/lib/cohorts");
      await joinCohort("c1", "u1");
      expect(prisma.cohortMember.upsert).toHaveBeenCalled();
    });
  });

  describe("isMember", () => {
    it("returns true when member exists", async () => {
      (prisma.cohortMember.findUnique as jest.Mock).mockResolvedValue({ id: "m1" });
      const { isMember } = await import("@/lib/cohorts");
      const result = await isMember("c1", "u1");
      expect(result).toBe(true);
    });
    it("returns false when not member", async () => {
      (prisma.cohortMember.findUnique as jest.Mock).mockResolvedValue(null);
      const { isMember } = await import("@/lib/cohorts");
      const result = await isMember("c1", "u1");
      expect(result).toBe(false);
    });
  });
});
