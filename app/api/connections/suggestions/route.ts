import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

const PROFILE_SNIPPET = {
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const connections = await prisma.connection.findMany({
    where: { OR: [{ requesterId: userId }, { recipientId: userId }] },
    select: { requesterId: true, recipientId: true },
  });
  const excludeIds = new Set<string>([userId]);
  connections.forEach((c) => {
    excludeIds.add(c.requesterId === userId ? c.recipientId : c.requesterId);
  });

  const secondDegreeIds: string[] = [];
  if (excludeIds.size > 1) {
    const conn = await prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: { in: Array.from(excludeIds) } },
          { recipientId: { in: Array.from(excludeIds) } },
        ],
        status: "ACCEPTED",
      },
      select: { requesterId: true, recipientId: true },
    });
    const scoreMap = new Map<string, number>();
    conn.forEach((c) => {
      const other = excludeIds.has(c.requesterId) ? c.recipientId : c.requesterId;
      if (!excludeIds.has(other)) {
        scoreMap.set(other, (scoreMap.get(other) ?? 0) + 1);
      }
    });
    secondDegreeIds.push(...Array.from(scoreMap.entries()).sort((a, b) => b[1] - a[1]).map(([id]) => id));
  }

  const myFollows = await prisma.companyFollow.findMany({
    where: { userId },
    select: { companyId: true },
  });
  let atCompanyIds: string[] = [];
  if (myFollows.length > 0) {
    const admins = await prisma.companyAdmin.findMany({
      where: { companyId: { in: myFollows.map((f) => f.companyId) } },
      select: { userId: true },
    });
    atCompanyIds = admins.map((a) => a.userId).filter((id) => !excludeIds.has(id));
  }

  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId },
    select: {
      careerIntents: { take: 2, select: { targetRole: true, targetIndustry: true } },
    },
  });
  let sameIntentIds: string[] = [];
  if (profile?.careerIntents?.length) {
    const industries = profile.careerIntents.map((i) => i.targetIndustry).filter(Boolean);
    if (industries.length > 0) {
      const same = await prisma.jobSeekerProfile.findMany({
        where: {
          userId: { notIn: Array.from(excludeIds) },
          careerIntents: { some: { targetIndustry: { in: industries } } },
        },
        select: { userId: true },
      });
      sameIntentIds = same.map((s) => s.userId);
    }
  }

  const combined = Array.from(new Set([...secondDegreeIds, ...atCompanyIds, ...sameIntentIds])).slice(
    0,
    10
  );
  if (combined.length === 0) {
    return NextResponse.json({ success: true, data: [] });
  }

  const users = await prisma.user.findMany({
    where: { id: { in: combined } },
    select: PROFILE_SNIPPET,
  });

  const order = new Map(combined.map((id, i) => [id, i]));
  const data = users
    .map((u) => ({
      id: u.id,
      name: u.name,
      image: u.image,
      headline: u.jobSeekerProfile?.headline ?? null,
      currentRole: u.jobSeekerProfile?.currentRole ?? null,
      currentCompany: u.jobSeekerProfile?.currentCompany ?? null,
      username: u.jobSeekerProfile?.username ?? null,
    }))
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return NextResponse.json({ success: true, data });
}
