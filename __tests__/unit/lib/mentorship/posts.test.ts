/**
 * Phase 5 (BL-8) — Mentor Posts: unit tests.
 */
import { prisma } from "@/lib/prisma/client";

jest.mock("@/lib/prisma/client", () => ({
  prisma: {
    mentorProfile: { findUnique: jest.fn() },
    mentorPost: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    mentorFollow: { findMany: jest.fn() },
  },
}));

describe("Mentor Posts (BL-8)", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("createPost", () => {
    it("rejects empty content", async () => {
      const { createPost } = await import("@/lib/mentorship/posts");
      const result = await createPost("mentor-1", "");
      expect(result).toEqual({ ok: false, error: "Content is required" });
      expect(prisma.mentorPost.create).not.toHaveBeenCalled();
    });

    it("rejects content over 2000 chars", async () => {
      const { createPost } = await import("@/lib/mentorship/posts");
      const result = await createPost("mentor-1", "a".repeat(2001));
      expect(result.ok).toBe(false);
      expect(result.error).toContain("2000");
    });

    it("rejects when mentor is not verified", async () => {
      (prisma.mentorProfile.findUnique as jest.Mock).mockResolvedValue({
        id: "mp1",
        isPublic: true,
        verificationStatus: "PENDING",
      });
      const { createPost } = await import("@/lib/mentorship/posts");
      const result = await createPost("mentor-1", "Hello world");
      expect(result).toEqual({ ok: false, error: "Only verified, public mentors can post" });
    });

    it("creates post when mentor is verified and public", async () => {
      (prisma.mentorProfile.findUnique as jest.Mock).mockResolvedValue({
        id: "mp1",
        isPublic: true,
        verificationStatus: "VERIFIED",
      });
      (prisma.mentorPost.create as jest.Mock).mockResolvedValue({
        id: "post-1",
        mentorUserId: "mentor-1",
        content: "Hello world",
        imageUrl: null,
        createdAt: new Date(),
      });
      const { createPost } = await import("@/lib/mentorship/posts");
      const result = await createPost("mentor-1", "Hello world", "https://img.example/1.jpg");
      expect(result).toEqual({ ok: true, postId: "post-1" });
      expect(prisma.mentorPost.create).toHaveBeenCalledWith({
        data: {
          mentorUserId: "mentor-1",
          content: "Hello world",
          imageUrl: "https://img.example/1.jpg",
        },
      });
    });
  });

  describe("getFeedForFollower", () => {
    it("returns empty when user follows no mentors", async () => {
      (prisma.mentorFollow.findMany as jest.Mock).mockResolvedValue([]);
      const { getFeedForFollower } = await import("@/lib/mentorship/posts");
      const result = await getFeedForFollower("follower-1");
      expect(result).toEqual([]);
      expect(prisma.mentorPost.findMany).not.toHaveBeenCalled();
    });

    it("returns posts from followed mentors", async () => {
      (prisma.mentorFollow.findMany as jest.Mock).mockResolvedValue([
        { mentorUserId: "m1" },
        { mentorUserId: "m2" },
      ]);
      (prisma.mentorPost.findMany as jest.Mock).mockResolvedValue([
        {
          id: "p1",
          mentorUserId: "m1",
          content: "Post 1",
          imageUrl: null,
          createdAt: new Date(),
          mentorUser: { id: "m1", name: "Alice", image: null },
        },
      ]);
      const { getFeedForFollower } = await import("@/lib/mentorship/posts");
      const result = await getFeedForFollower("follower-1");
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("Post 1");
      expect(result[0].mentorName).toBe("Alice");
    });
  });

  describe("getPostsByMentor", () => {
    it("returns posts for mentor", async () => {
      (prisma.mentorPost.findMany as jest.Mock).mockResolvedValue([
        {
          id: "p1",
          mentorUserId: "m1",
          content: "Tip 1",
          imageUrl: null,
          createdAt: new Date(),
          mentorUser: { id: "m1", name: "Bob", image: "https://img/bob.jpg" },
        },
      ]);
      const { getPostsByMentor } = await import("@/lib/mentorship/posts");
      const result = await getPostsByMentor("m1");
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("Tip 1");
      expect(result[0].mentorImage).toBe("https://img/bob.jpg");
    });
  });
});
