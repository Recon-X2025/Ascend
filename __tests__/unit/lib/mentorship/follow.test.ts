/**
 * Phase 4 (BL-7) — Follow Mentors: unit tests.
 */
import { prisma } from "@/lib/prisma/client";

jest.mock("@/lib/prisma/client", () => ({
  prisma: {
    mentorProfile: { findUnique: jest.fn() },
    mentorFollow: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe("Mentor Follow (BL-7)", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("followMentor", () => {
    it("rejects when follower and mentor are the same user", async () => {
      const { followMentor } = await import("@/lib/mentorship/follow");
      const result = await followMentor("user-1", "user-1");
      expect(result).toEqual({ ok: false, error: "Cannot follow yourself" });
      expect(prisma.mentorProfile.findUnique).not.toHaveBeenCalled();
    });

    it("rejects when mentor profile is not found", async () => {
      (prisma.mentorProfile.findUnique as jest.Mock).mockResolvedValue(null);
      const { followMentor } = await import("@/lib/mentorship/follow");
      const result = await followMentor("follower-1", "mentor-1");
      expect(result).toEqual({ ok: false, error: "Mentor not found or not discoverable" });
    });

    it("rejects when mentor profile is not public", async () => {
      (prisma.mentorProfile.findUnique as jest.Mock).mockResolvedValue({
        id: "mp1",
        isPublic: false,
        verificationStatus: "VERIFIED",
      });
      const { followMentor } = await import("@/lib/mentorship/follow");
      const result = await followMentor("follower-1", "mentor-1");
      expect(result).toEqual({ ok: false, error: "Mentor not found or not discoverable" });
    });

    it("rejects when mentor is not verified", async () => {
      (prisma.mentorProfile.findUnique as jest.Mock).mockResolvedValue({
        id: "mp1",
        isPublic: true,
        verificationStatus: "PENDING",
      });
      const { followMentor } = await import("@/lib/mentorship/follow");
      const result = await followMentor("follower-1", "mentor-1");
      expect(result).toEqual({ ok: false, error: "Mentor not found or not discoverable" });
    });

    it("creates follow record when mentor is public and verified", async () => {
      (prisma.mentorProfile.findUnique as jest.Mock).mockResolvedValue({
        id: "mp1",
        isPublic: true,
        verificationStatus: "VERIFIED",
      });
      (prisma.mentorFollow.upsert as jest.Mock).mockResolvedValue({});
      const { followMentor } = await import("@/lib/mentorship/follow");
      const result = await followMentor("follower-1", "mentor-1");
      expect(result).toEqual({ ok: true });
      expect(prisma.mentorFollow.upsert).toHaveBeenCalledWith({
        where: { userId_mentorUserId: { userId: "follower-1", mentorUserId: "mentor-1" } },
        create: { userId: "follower-1", mentorUserId: "mentor-1" },
        update: {},
      });
    });
  });

  describe("unfollowMentor", () => {
    it("calls deleteMany with correct params", async () => {
      (prisma.mentorFollow.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      const { unfollowMentor } = await import("@/lib/mentorship/follow");
      const result = await unfollowMentor("follower-1", "mentor-1");
      expect(result).toEqual({ ok: true });
      expect(prisma.mentorFollow.deleteMany).toHaveBeenCalledWith({
        where: { userId: "follower-1", mentorUserId: "mentor-1" },
      });
    });
  });

  describe("isFollowing", () => {
    it("returns true when follow exists", async () => {
      (prisma.mentorFollow.findUnique as jest.Mock).mockResolvedValue({
        id: "mf1",
        userId: "follower-1",
        mentorUserId: "mentor-1",
      });
      const { isFollowing } = await import("@/lib/mentorship/follow");
      const result = await isFollowing("follower-1", "mentor-1");
      expect(result).toBe(true);
    });

    it("returns false when follow does not exist", async () => {
      (prisma.mentorFollow.findUnique as jest.Mock).mockResolvedValue(null);
      const { isFollowing } = await import("@/lib/mentorship/follow");
      const result = await isFollowing("follower-1", "mentor-1");
      expect(result).toBe(false);
    });
  });

  describe("getFollowerCount", () => {
    it("returns count for mentor", async () => {
      (prisma.mentorFollow.count as jest.Mock).mockResolvedValue(42);
      const { getFollowerCount } = await import("@/lib/mentorship/follow");
      const result = await getFollowerCount("mentor-1");
      expect(result).toBe(42);
    });
  });

  describe("getFollowingMentors", () => {
    it("returns mentors user follows with name and image", async () => {
      (prisma.mentorFollow.findMany as jest.Mock).mockResolvedValue([
        {
          mentorUserId: "m1",
          followedAt: new Date("2025-03-01"),
          mentorUser: { id: "m1", name: "Alice", image: "https://img/1.jpg" },
        },
        {
          mentorUserId: "m2",
          followedAt: new Date("2025-02-28"),
          mentorUser: { id: "m2", name: "Bob", image: null },
        },
      ]);
      const { getFollowingMentors } = await import("@/lib/mentorship/follow");
      const result = await getFollowingMentors("follower-1");
      expect(result).toEqual([
        { mentorUserId: "m1", mentorName: "Alice", mentorImage: "https://img/1.jpg", followedAt: new Date("2025-03-01") },
        { mentorUserId: "m2", mentorName: "Bob", mentorImage: null, followedAt: new Date("2025-02-28") },
      ]);
      expect(prisma.mentorFollow.findMany).toHaveBeenCalledWith({
        where: { userId: "follower-1" },
        orderBy: { followedAt: "desc" },
        include: { mentorUser: { select: { id: true, name: true, image: true } } },
      });
    });
  });
});
