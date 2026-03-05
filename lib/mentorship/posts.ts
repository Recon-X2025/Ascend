/**
 * BL-8: Mentor Posts — mentors publish short insights; followers see in feed.
 */

import { prisma } from "@/lib/prisma/client";

const MAX_CONTENT_LENGTH = 2000;

export interface MentorPostItem {
  id: string;
  mentorUserId: string;
  mentorName: string | null;
  mentorImage: string | null;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
}

export async function createPost(
  mentorUserId: string,
  content: string,
  imageUrl?: string | null
): Promise<{ ok: boolean; postId?: string; error?: string }> {
  const trimmed = content?.trim() ?? "";
  if (!trimmed) return { ok: false, error: "Content is required" };
  if (trimmed.length > MAX_CONTENT_LENGTH) {
    return { ok: false, error: `Content must be ${MAX_CONTENT_LENGTH} characters or less` };
  }

  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: mentorUserId },
    select: { id: true, isPublic: true, verificationStatus: true },
  });
  if (!mentorProfile || !mentorProfile.isPublic || mentorProfile.verificationStatus !== "VERIFIED") {
    return { ok: false, error: "Only verified, public mentors can post" };
  }

  try {
    const post = await prisma.mentorPost.create({
      data: {
        mentorUserId,
        content: trimmed,
        imageUrl: imageUrl && imageUrl.trim() ? imageUrl.trim() : null,
      },
    });
    return { ok: true, postId: post.id };
  } catch (e) {
    console.error("[mentorship/posts] createPost error:", e);
    return { ok: false, error: "Failed to create post" };
  }
}

/** Posts from mentors the user follows, newest first. */
export async function getFeedForFollower(followerId: string, limit = 50): Promise<MentorPostItem[]> {
  const follows = await prisma.mentorFollow.findMany({
    where: { userId: followerId },
    select: { mentorUserId: true },
  });
  const mentorIds = follows.map((f) => f.mentorUserId);
  if (mentorIds.length === 0) return [];

  const posts = await prisma.mentorPost.findMany({
    where: { mentorUserId: { in: mentorIds } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      mentorUser: { select: { id: true, name: true, image: true } },
    },
  });
  return posts.map((p) => ({
    id: p.id,
    mentorUserId: p.mentorUserId,
    mentorName: p.mentorUser.name,
    mentorImage: p.mentorUser.image,
    content: p.content,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt,
  }));
}

/** Posts by a specific mentor, newest first. */
export async function getPostsByMentor(mentorUserId: string, limit = 20): Promise<MentorPostItem[]> {
  const posts = await prisma.mentorPost.findMany({
    where: { mentorUserId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      mentorUser: { select: { id: true, name: true, image: true } },
    },
  });
  return posts.map((p) => ({
    id: p.id,
    mentorUserId: p.mentorUserId,
    mentorName: p.mentorUser.name,
    mentorImage: p.mentorUser.image,
    content: p.content,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt,
  }));
}
