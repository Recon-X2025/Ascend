import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const adminId = searchParams.get("adminId")?.trim() ?? "";
  const action = searchParams.get("action")?.trim() ?? "";
  const targetType = searchParams.get("targetType")?.trim() ?? "";
  const cursor = searchParams.get("cursor") ?? "";
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

  const where: Record<string, unknown> = {};
  if (adminId) where.adminId = adminId;
  if (action) where.action = action;
  if (targetType) where.targetType = targetType;

  const entries = await prisma.auditLog.findMany({
    where,
    select: {
      id: true,
      adminId: true,
      action: true,
      targetType: true,
      targetId: true,
      targetLabel: true,
      metadata: true,
      createdAt: true,
      admin: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = entries.length > limit;
  const items = hasMore ? entries.slice(0, limit) : entries;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  const list = items.map((e) => ({
    id: e.id,
    adminId: e.adminId,
    adminName: e.admin?.name ?? e.admin?.email ?? null,
    adminEmail: e.admin?.email ?? null,
    action: e.action,
    targetType: e.targetType,
    targetId: e.targetId,
    targetLabel: e.targetLabel,
    metadata: e.metadata,
    createdAt: e.createdAt,
  }));

  return NextResponse.json({
    entries: list,
    nextCursor,
    hasMore: !!nextCursor,
  });
}
