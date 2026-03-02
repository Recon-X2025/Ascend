import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!mentorProfile) {
    return NextResponse.json([]);
  }

  const applications = await prisma.mentorApplication.findMany({
    where: { mentorProfileId: mentorProfile.id },
    orderBy: { submittedAt: "desc" },
    include: {
      mentee: {
        select: {
          id: true,
          name: true,
          image: true,
          jobSeekerProfile: {
            select: {
              headline: true,
              currentRole: true,
            },
          },
        },
      },
    },
  });

  const list = applications.map((a) => ({
    id: a.id,
    status: a.status,
    submittedAt: a.submittedAt.toISOString(),
    expiresAt: a.expiresAt.toISOString(),
    mentorQuestion: a.mentorQuestion,
    menteeAnswer: a.menteeAnswer,
    matchReason: a.matchReason,
    whyThisMentor: a.whyThisMentor,
    goalStatement: a.goalStatement,
    commitment: a.commitment,
    timeline: a.timeline,
    whatAlreadyTried: a.whatAlreadyTried,
    menteeName: a.mentee.name,
    menteeHeadline: a.mentee.jobSeekerProfile?.headline,
    menteeCurrentRole: a.mentee.jobSeekerProfile?.currentRole,
  }));

  return NextResponse.json(list);
}
