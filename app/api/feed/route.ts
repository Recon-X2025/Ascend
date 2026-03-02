import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const includeSeen = searchParams.get("includeSeen") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const where: { userId: string; seen?: boolean } = {
    userId: session.user.id,
  };
  if (!includeSeen) where.seen = false;

  const [signals, total] = await Promise.all([
    prisma.careerSignal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            image: true,
            jobSeekerProfile: { select: { headline: true, currentRole: true, username: true } },
          },
        },
        company: { select: { id: true, slug: true, name: true } },
        jobPost: { select: { id: true, slug: true, title: true } },
      },
    }),
    prisma.careerSignal.count({ where }),
  ]);

  const data = signals.map((s) => ({
    id: s.id,
    type: s.type,
    actorId: s.actorId,
    actor: s.actor
      ? {
          id: s.actor.id,
          name: s.actor.name,
          image: s.actor.image,
          headline: s.actor.jobSeekerProfile?.headline ?? null,
          currentRole: s.actor.jobSeekerProfile?.currentRole ?? null,
          username: s.actor.jobSeekerProfile?.username ?? null,
        }
      : null,
    companyId: s.companyId,
    company: s.company,
    jobPostId: s.jobPostId,
    jobPost: s.jobPost,
    metadata: s.metadata,
    seen: s.seen,
    createdAt: s.createdAt,
  }));

  return NextResponse.json({
    success: true,
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  });
}
