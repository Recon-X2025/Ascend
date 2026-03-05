import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { PublicMentorProfile } from "@/components/mentorship/PublicMentorProfile";
import { ReportButton } from "@/components/common/ReportButton";
import { ShareButton } from "@/components/growth/ShareButton";
import { isFollowing, getFollowerCount } from "@/lib/mentorship/follow";
import {
  MENTOR_COMPANY_TYPE_LABELS,
  M2_FOCUS_AREA_LABELS,
  ENGAGEMENT_LENGTH_LABELS,
  SESSION_FREQUENCY_LABELS,
  GEOGRAPHY_SCOPE_LABELS,
  DAY_OF_WEEK_LABELS,
} from "@/lib/mentorship/m2-labels";

export default async function PublicMentorPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const session = await getServerSession(authOptions);

  const profile = await prisma.mentorProfile.findFirst({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, image: true } },
      availabilityWindows: true,
    },
  });

  if (!profile || !profile.isPublic || profile.verificationStatus !== "VERIFIED") {
    notFound();
  }

  const [isFollowingMentor, followerCount] = await Promise.all([
    session?.user?.id ? isFollowing(session.user.id, userId) : false,
    getFollowerCount(userId),
  ]);

  return (
    <div className="min-h-screen bg-[#F7F6F1] px-4 py-8 relative">
      <div className="absolute top-6 right-4 flex items-center gap-2">
        <ShareButton
          entityType="MENTOR"
          entityId={userId}
          url={`/mentors/${userId}`}
          title={profile.user?.name ?? "Mentor profile"}
        />
        <ReportButton
          targetType="MENTOR_PROFILE"
          targetId={userId}
          canReport={!!session?.user?.id && session.user.id !== userId}
        />
      </div>
      <div className="max-w-2xl mx-auto">
        <PublicMentorProfile
          profile={profile}
          mentorUserId={userId}
          isFollowing={isFollowingMentor}
          followerCount={followerCount}
          showFollowButton={!!session?.user?.id && session.user.id !== userId}
          labels={{
            companyType: MENTOR_COMPANY_TYPE_LABELS,
            focusArea: M2_FOCUS_AREA_LABELS,
            engagement: ENGAGEMENT_LENGTH_LABELS,
            frequency: SESSION_FREQUENCY_LABELS,
            geography: GEOGRAPHY_SCOPE_LABELS,
            dayOfWeek: DAY_OF_WEEK_LABELS,
          }}
        />
      </div>
    </div>
  );
}
