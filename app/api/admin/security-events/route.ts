import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type")?.trim() ?? null;
  const actorIp = searchParams.get("actorIp")?.trim() ?? null;
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (actorIp) where.actorIp = actorIp;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) (where.createdAt as { gte?: Date }).gte = new Date(dateFrom);
    if (dateTo) (where.createdAt as { lte?: Date }).lte = new Date(dateTo);
  }

  const [events, total] = await Promise.all([
    prisma.securityEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.securityEvent.count({ where }),
  ]);

  const data = events.map((e) => ({
    id: e.id,
    timestamp: e.createdAt.toISOString(),
    type: e.type,
    actorIp: e.actorIp,
    actorId: e.actorId,
    endpoint: e.endpoint,
    details: e.metadata,
  }));

  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
}
