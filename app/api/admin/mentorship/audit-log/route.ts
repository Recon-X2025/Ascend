import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import type { MentorshipAuditCategory } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as MentorshipAuditCategory | null;
  const action = searchParams.get("action")?.trim() || undefined;
  const actorId = searchParams.get("actorId")?.trim() || undefined;
  const entityType = searchParams.get("entityType")?.trim() || undefined;
  const entityId = searchParams.get("entityId")?.trim() || undefined;
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (action) where.action = action;
  if (actorId) where.actorId = actorId;
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (from || to) {
    const dateRange: { gte?: Date; lte?: Date } = {};
    if (from) dateRange.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      dateRange.lte = toDate;
    }
    where.createdAt = dateRange;
  }

  const [items, total] = await Promise.all([
    prisma.mentorshipAuditLog.findMany({
      where,
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: page * limit,
      take: limit,
    }),
    prisma.mentorshipAuditLog.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map((log) => ({
      id: log.id,
      actorId: log.actorId,
      actorName: log.actor.name ?? log.actor.email ?? log.actorId,
      action: log.action,
      category: log.category,
      entityType: log.entityType,
      entityId: log.entityId,
      previousState: log.previousState,
      newState: log.newState,
      reason: log.reason,
      actorIp: log.actorIp,
      createdAt: log.createdAt,
    })),
    total,
    page,
    limit,
  });
}
