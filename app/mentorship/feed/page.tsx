import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { FeedClient } from "./FeedClient";
import { getFeedForFollower } from "@/lib/mentorship/posts";

export default async function MentorFeedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/mentorship/feed");
  }

  const [mentorProfile, initialPosts] = await Promise.all([
    prisma.mentorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, isPublic: true, verificationStatus: true },
    }),
    getFeedForFollower(session.user.id, 50),
  ]);

  const isMentor = !!mentorProfile?.isPublic && mentorProfile.verificationStatus === "VERIFIED";
  const postsForClient = initialPosts.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-[#F7F6F1] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-[#0F1A0F] mb-2">Mentor feed</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Posts from mentors you follow
        </p>
        <FeedClient initialPosts={postsForClient} isMentor={isMentor} />
      </div>
    </div>
  );
}

