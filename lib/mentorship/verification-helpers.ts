import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import type { MentorProfile } from "@prisma/client";

/**
 * Returns the current user's MentorProfile if they have one; 401/403 if not authenticated or no mentor profile.
 */
export async function getMentorProfileOrThrow(): Promise<MentorProfile> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!mentorProfile) {
    throw new Error("FORBIDDEN");
  }
  return mentorProfile;
}
