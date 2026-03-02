import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import type { OpsAlertType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as OpsAlertType | null;
  const severity = searchParams.get("severity")?.trim() || undefined;
  const isRead = searchParams.get("isRead");
  const resolved = searchParams.get("resolved"); // "true" | "false" | ""

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (severity) where.severity = severity;
  if (isRead === "true") where.isRead = true;
  if (isRead === "false") where.isRead = false;
  if (resolved === "true") where.resolvedAt = { not: null };
  if (resolved === "false") where.resolvedAt = null;

  const items = await prisma.opsAlert.findMany({
    where,
    include: { resolvedBy: { select: { id: true, name: true, email: true } } },
    orderBy: [{ resolvedAt: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  return NextResponse.json({
    items: items.map((a) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      entityType: a.entityType,
      entityId: a.entityId,
      message: a.message,
      isRead: a.isRead,
      resolvedAt: a.resolvedAt,
      resolvedById: a.resolvedById,
      resolvedByName: a.resolvedBy?.name ?? a.resolvedBy?.email ?? null,
      createdAt: a.createdAt,
    })),
  });
}
