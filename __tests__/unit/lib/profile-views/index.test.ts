/**
 * Phase 2 (BL-1) — Profile View Notifications: unit tests.
 */
import { prisma } from "@/lib/prisma/client";

jest.mock("@/lib/prisma/client", () => ({
  prisma: {
    profileViewEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock("@/lib/payments/gate", () => ({
  canUseFeature: jest.fn(),
}));

describe("Profile Views (BL-1)", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("recordProfileView", () => {
    it("calls prisma.profileViewEvent.create with correct data", async () => {
      const { recordProfileView } = await import("@/lib/profile-views");
      (prisma.profileViewEvent.create as jest.Mock).mockResolvedValue({});

      await recordProfileView({
        viewerId: "viewer-1",
        profileUserId: "profile-1",
        viewerCompanyName: "Acme Corp",
        viewerRole: "Senior Recruiter",
      });

      expect(prisma.profileViewEvent.create).toHaveBeenCalledWith({
        data: {
          viewerId: "viewer-1",
          profileUserId: "profile-1",
          viewerCompanyId: null,
          viewerCompanyName: "Acme Corp",
          viewerRole: "Senior Recruiter",
        },
      });
    });
  });

  describe("getProfileViewInsights", () => {
    it("returns aggregate for free user when canSeeCompanyNames is false", async () => {
      const { canUseFeature } = await import("@/lib/payments/gate");
      (canUseFeature as jest.Mock).mockResolvedValue({ allowed: false });
      (prisma.profileViewEvent.findMany as jest.Mock).mockResolvedValue([
        { viewerCompanyName: "Acme", viewedAt: new Date() },
      ]);

      const { getProfileViewInsights } = await import("@/lib/profile-views");
      const result = await getProfileViewInsights("user-1");

      expect(result.canSeeCompanyNames).toBe(false);
      expect(result.totalViews).toBe(1);
      expect(result.byCompany).toHaveLength(1);
      expect(result.byCompany[0].companyName).toBe("Recruiters");
      expect(result.byCompany[0].count).toBe(1);
    });
  });
});
