import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import type { DataRequestStatus, DataRequestType } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as DataRequestStatus | null;
  const type = searchParams.get("type") as DataRequestType | null;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const where: { status?: DataRequestStatus; type?: DataRequestType } = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const [requests, total] = await Promise.all([
    prisma.dataRequest.findMany({
      where,
      orderBy: { requestedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            deletedAt: true,
          },
        },
      },
    }),
    prisma.dataRequest.count({ where }),
  ]);

  const data = requests.map((r) => ({
    id: r.id,
    userId: r.userId,
    type: r.type,
    status: r.status,
    requestedAt: r.requestedAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
    exportUrl: r.exportUrl ?? null,
    user: r.user
      ? {
          id: r.user.id,
          email: r.user.deletedAt ? "(deleted)" : r.user.email,
          name: r.user.deletedAt ? null : r.user.name,
          role: r.user.role,
        }
      : null,
  }));

  return NextResponse.json({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
