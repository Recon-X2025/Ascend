/**
 * Phase 7 (BL-4) — Transition Community Signals: unit tests.
 */
import { prisma } from "@/lib/prisma/client";

jest.mock("@/lib/prisma/client", () => ({
  prisma: {
    userCareerContext: { count: jest.fn() },
    mentorshipOutcome: { count: jest.fn() },
  },
}));

describe("Transition Community Signals (BL-4)", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("getTransitionPathFromContext", () => {
    it("returns normalized path from currentRole and targetRole", async () => {
      const { getTransitionPathFromContext } = await import("@/lib/community/transition-signals");
      expect(getTransitionPathFromContext("SWE", "PM")).toBe("swe → pm");
      expect(getTransitionPathFromContext("  Engineer  ", "  Product Manager  ")).toBe("engineer → product manager");
    });

    it("returns null when roles missing", async () => {
      const { getTransitionPathFromContext } = await import("@/lib/community/transition-signals");
      expect(getTransitionPathFromContext(null, "PM")).toBe(null);
      expect(getTransitionPathFromContext("SWE", null)).toBe(null);
      expect(getTransitionPathFromContext("", "")).toBe(null);
    });
  });

  describe("getTransitionPathCount", () => {
    it("returns 0 for invalid path", async () => {
      const { getTransitionPathCount } = await import("@/lib/community/transition-signals");
      const r = await getTransitionPathCount("");
      expect(r.count).toBe(0);
      expect(r.rounded).toBe(0);
    });

    it("returns rounded count from seekers and completions", async () => {
      (prisma.userCareerContext.count as jest.Mock).mockResolvedValue(17);
      (prisma.mentorshipOutcome.count as jest.Mock).mockResolvedValue(3);
      const { getTransitionPathCount } = await import("@/lib/community/transition-signals");
      const r = await getTransitionPathCount("SWE → PM");
      expect(r.count).toBe(20);
      expect(r.rounded).toBe(20);
      expect(r.completions).toBe(3);
    });

    it("rounds small counts to nearest 5", async () => {
      (prisma.userCareerContext.count as jest.Mock).mockResolvedValue(7);
      (prisma.mentorshipOutcome.count as jest.Mock).mockResolvedValue(0);
      const { getTransitionPathCount } = await import("@/lib/community/transition-signals");
      const r = await getTransitionPathCount("Engineer → PM");
      expect(r.rounded).toBe(5);
    });
  });
});
