/**
 * BL-7: Mentor follow — seekers follow mentors without starting an application.
 */

import { prisma } from "@/lib/prisma/client";

export async function followMentor(followerId: string, mentorUserId: string): Promise<{ ok: boolean; error?: string }> {
  if (followerId === mentorUserId) {
    return { ok: false, error: "Cannot follow yourself" };
  }
  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: mentorUserId },
    select: { id: true, isPublic: true, verificationStatus: true },
  });
  if (!mentorProfile || !mentorProfile.isPublic || mentorProfile.verificationStatus !== "VERIFIED") {
    return { ok: false, error: "Mentor not found or not discoverable" };
  }
  try {
    await prisma.mentorFollow.upsert({
      where: {
        userId_mentorUserId: { userId: followerId, mentorUserId },
      },
      create: { userId: followerId, mentorUserId },
      update: {},
    });
    return { ok: true };
  } catch (e) {
    console.error("[mentorship/follow] followMentor error:", e);
    return { ok: false, error: "Failed to follow" };
  }
}

export async function unfollowMentor(followerId: string, mentorUserId: string): Promise<{ ok: boolean }> {
  await prisma.mentorFollow.deleteMany({
    where: { userId: followerId, mentorUserId },
  });
  return { ok: true };
}

export async function isFollowing(followerId: string, mentorUserId: string): Promise<boolean> {
  const follow = await prisma.mentorFollow.findUnique({
    where: { userId_mentorUserId: { userId: followerId, mentorUserId } },
  });
  return !!follow;
}

export async function getFollowerCount(mentorUserId: string): Promise<number> {
  return prisma.mentorFollow.count({
    where: { mentorUserId },
  });
}

export async function getFollowingMentors(followerId: string): Promise<Array<{
  mentorUserId: string;
  mentorName: string | null;
  mentorImage: string | null;
  followedAt: Date;
}>> {
  const follows = await prisma.mentorFollow.findMany({
    where: { userId: followerId },
    orderBy: { followedAt: "desc" },
    include: {
      mentorUser: { select: { id: true, name: true, image: true } },
    },
  });
  return follows.map((f) => ({
    mentorUserId: f.mentorUserId,
    mentorName: f.mentorUser.name,
    mentorImage: f.mentorUser.image,
    followedAt: f.followedAt,
  }));
}
