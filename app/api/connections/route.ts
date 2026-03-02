import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import type { ConnectionStatus, ConnectionType } from "@prisma/client";

const profileSnippet = {
  id: true,
  name: true,
  image: true,
  jobSeekerProfile: {
    select: {
      headline: true,
      currentRole: true,
      currentCompany: true,
      username: true,
    },
  },
} as const;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN" | null;
  const type = searchParams.get("type") as "PEER" | "MENTOR" | "COLLEAGUE" | "INTERVIEWER" | null;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const where: {
    OR: Array<{ requesterId: string } | { recipientId: string }>;
    status?: ConnectionStatus;
    type?: ConnectionType;
  } = {
    OR: [{ requesterId: session.user.id }, { recipientId: session.user.id }],
  };
  if (status) where.status = status as ConnectionStatus;
  if (type) where.type = type as ConnectionType;

  const [connections, total] = await Promise.all([
    prisma.connection.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: {
        requester: { select: profileSnippet },
        recipient: { select: profileSnippet },
      },
    }),
    prisma.connection.count({ where }),
  ]);

  const data = connections.map((c) => {
    const other = c.requesterId === session.user!.id ? c.recipient : c.requester;
    const isRequester = c.requesterId === session.user!.id;
    return {
      id: c.id,
      type: c.type,
      contextTag: c.contextTag,
      status: c.status,
      connectedAt: c.connectedAt,
      createdAt: c.createdAt,
      isRequester,
      other: {
        id: other.id,
        name: other.name,
        image: other.image,
        headline: other.jobSeekerProfile?.headline ?? null,
        currentRole: other.jobSeekerProfile?.currentRole ?? null,
        currentCompany: other.jobSeekerProfile?.currentCompany ?? null,
        username: other.jobSeekerProfile?.username ?? null,
      },
    };
  });

  return NextResponse.json({
    success: true,
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  });
}
