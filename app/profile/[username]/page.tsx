import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { profileInclude } from "@/lib/profile/queries";
import { PublicProfileView } from "@/components/profile/PublicProfileView";
import { ReportButton } from "@/components/common/ReportButton";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { username: username.trim().toLowerCase() },
    include: { user: { select: { name: true } } },
  });
  if (!profile || profile.visibility !== "PUBLIC") {
    return { title: "Profile | Ascend" };
  }
  const name = profile.user?.name ?? "User";
  const headline = profile.headline ?? "Professional";
  const summary = profile.summary?.slice(0, 160) ?? "";
  return {
    title: `${name} — ${headline} | Ascend`,
    description: summary,
    robots: profile.visibility === "PUBLIC" ? "index, follow" : "noindex, nofollow",
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const session = await getServerSession(authOptions);
  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { username: username.trim().toLowerCase() },
    include: {
      ...profileInclude,
      user: { select: { name: true, image: true } },
    },
  });
  if (!profile) notFound();
  const isOwner = session?.user?.id === profile.userId;

  const [hasMentorshipCheckInBadge, endorsementsForProfile, isConnected, endorsedByMe, profileBadges] = await Promise.all([
    prisma.mentorshipOutcome.findFirst({
      where: { menteeId: profile.userId, checkInBadgeGranted: true },
      select: { id: true },
    }).then((r) => !!r),
    prisma.profileEndorsement.findMany({
      where: { recipientId: profile.userId },
      include: { endorser: { select: { name: true } } },
    }),
    session?.user?.id
      ? prisma.connection.findFirst({
          where: {
            status: "ACCEPTED",
            OR: [
              { requesterId: session.user.id, recipientId: profile.userId },
              { requesterId: profile.userId, recipientId: session.user.id },
            ],
          },
        }).then((c) => !!c)
      : false,
    session?.user?.id
      ? prisma.profileEndorsement.findMany({
          where: { endorserId: session.user.id, recipientId: profile.userId },
          select: { skill: true },
        }).then((r) => r.map((e) => e.skill))
      : [],
    prisma.profileBadge.findMany({
      where: { userId: profile.userId, status: "ACTIVE" },
      orderBy: { issuedAt: "desc" },
    }),
  ]);

  const endorsementCountBySkill: Record<string, number> = {};
  const endorsersBySkill: Record<string, string[]> = {};
  for (const e of endorsementsForProfile) {
    endorsementCountBySkill[e.skill] = (endorsementCountBySkill[e.skill] ?? 0) + 1;
    const name = e.endorser.name?.trim();
    const display = name ? (name.split(/\s+/).length > 1 ? `${name.split(/\s+/)[0]} ${name.split(/\s+/)[1]?.charAt(0) ?? ""}.` : name) : "Someone";
    if (!endorsersBySkill[e.skill]) endorsersBySkill[e.skill] = [];
    if (endorsersBySkill[e.skill].length < 3 && !endorsersBySkill[e.skill].includes(display)) {
      endorsersBySkill[e.skill].push(display);
    }
  }

  if (!isOwner && session?.user?.id) {
    await prisma.jobSeekerProfile.update({
      where: { userId: profile.userId },
      data: { profileViews: { increment: 1 } },
    });
    const role = (session.user as { role?: string }).role;
    if (role === "RECRUITER") {
      const { notifyProfileView } = await import("@/lib/notifications/create");
      const recruiter = await prisma.recruiterProfile.findUnique({
        where: { userId: session.user.id },
        select: { companyName: true },
      });
      if (recruiter?.companyName) {
        await notifyProfileView(profile.userId, recruiter.companyName);
      }
    }
  }

  return (
    <div className="min-h-screen bg-surface relative">
      <div className="absolute top-4 right-4">
        <ReportButton
          targetType="USER_PROFILE"
          targetId={profile.userId}
          canReport={!!session?.user?.id && !isOwner}
        />
      </div>
      <PublicProfileView
        profile={profile}
        isOwner={!!isOwner}
        hasMentorshipCheckInBadge={hasMentorshipCheckInBadge}
        endorsementCountBySkill={endorsementCountBySkill}
        endorsedByMe={endorsedByMe}
        isConnected={!!isConnected}
        profileUserId={profile.userId}
        profileBadges={profileBadges.map((b) => ({ provider: b.provider, skill: b.skill, score: b.score, percentile: b.percentile, badgeUrl: b.badgeUrl, verificationUrl: b.verificationUrl, expiresAt: b.expiresAt?.toISOString() ?? null, status: b.status }))}
      />
    </div>
  );
}
