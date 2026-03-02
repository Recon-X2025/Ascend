import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { profileInclude } from "@/lib/profile/queries";
import type { FullProfile } from "@/lib/profile/completion";

export async function getSessionUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function getProfileOrNull(userId: string) {
  return prisma.jobSeekerProfile.findUnique({
    where: { userId },
    include: profileInclude,
  });
}

export async function getProfileOrThrow(userId: string): Promise<FullProfile> {
  const profile = await getProfileOrNull(userId);
  if (!profile) throw new Error("Profile not found");
  return profile as FullProfile;
}
