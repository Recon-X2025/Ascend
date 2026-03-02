import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

const profileSnippet = {
  id: true,
  name: true,
  image: true,
  jobSeekerProfile: {
    select: { headline: true, currentRole: true, currentCompany: true, username: true },
  },
} as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [connections, profile, experiences] = await Promise.all([
    prisma.connection.findMany({
      where: {
        OR: [{ requesterId: userId }, { recipientId: userId }],
        status: "ACCEPTED",
      },
      include: {
        requester: { select: profileSnippet },
        recipient: { select: profileSnippet },
      },
    }),
    prisma.jobSeekerProfile.findUnique({
      where: { userId },
      select: {
        currentRole: true,
        currentCompany: true,
        careerIntents: { take: 2, select: { targetRole: true, targetIndustry: true } },
      },
    }),
    prisma.experience.findMany({
      where: { profile: { userId } },
      select: { company: true },
    }),
  ]);

  const connectionIds = new Set<string>();
  connections.forEach((c) => {
    connectionIds.add(c.requesterId === userId ? c.recipientId : c.requesterId);
  });

  const yourNetwork = connections.map((c) => {
    const other = c.requesterId === userId ? c.recipient : c.requester;
    return {
      id: other.id,
      name: other.name,
      image: other.image,
      headline: other.jobSeekerProfile?.headline ?? null,
      currentRole: other.jobSeekerProfile?.currentRole ?? null,
      currentCompany: other.jobSeekerProfile?.currentCompany ?? null,
      username: other.jobSeekerProfile?.username ?? null,
    };
  });

  let yourIndustry: Array<{
    id: string;
    name: string | null;
    image: string | null;
    headline: string | null;
    currentRole: string | null;
    currentCompany: string | null;
    username: string | null;
  }> = [];
  const industries = profile?.careerIntents?.map((i) => i.targetIndustry).filter(Boolean) ?? [];
  if (industries.length > 0) {
    const sameIndustry = await prisma.jobSeekerProfile.findMany({
      where: {
        userId: { notIn: [userId, ...Array.from(connectionIds)] },
        careerIntents: { some: { targetIndustry: { in: industries } } },
      },
      take: 20,
      select: { userId: true },
    });
    const ids = sameIndustry.map((s) => s.userId).filter((id) => !connectionIds.has(id));
    if (ids.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: ids } },
        select: profileSnippet,
      });
      yourIndustry = users.map((u) => ({
        id: u.id,
        name: u.name,
        image: u.image,
        headline: u.jobSeekerProfile?.headline ?? null,
        currentRole: u.jobSeekerProfile?.currentRole ?? null,
        currentCompany: u.jobSeekerProfile?.currentCompany ?? null,
        username: u.jobSeekerProfile?.username ?? null,
      }));
    }
  }

  const companyNames = Array.from(new Set(experiences.map((e) => e.company?.toLowerCase()).filter(Boolean))) as string[];
  let atThisCompany: typeof yourIndustry = [];
  if (companyNames.length > 0) {
    const alumni = await prisma.experience.findMany({
      where: {
        company: { in: companyNames },
        profile: { userId: { notIn: [userId, ...Array.from(connectionIds)] } },
      },
      take: 60,
      select: { profile: { select: { userId: true } } },
    });
    const seen = new Set<string>();
    const alumniIds = alumni
      .map((a) => a.profile.userId)
      .filter((id) => {
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .slice(0, 20);
    if (alumniIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: alumniIds } },
        select: profileSnippet,
      });
      atThisCompany = users.map((u) => ({
        id: u.id,
        name: u.name,
        image: u.image,
        headline: u.jobSeekerProfile?.headline ?? null,
        currentRole: u.jobSeekerProfile?.currentRole ?? null,
        currentCompany: u.jobSeekerProfile?.currentCompany ?? null,
        username: u.jobSeekerProfile?.username ?? null,
      }));
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      yourNetwork,
      yourIndustry,
      atThisCompany,
    },
  });
}
