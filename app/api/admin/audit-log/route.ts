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
  const category = searchParams.get("category");
  const severity = searchParams.get("severity");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const actorId = searchParams.get("actorId")?.trim() ?? null;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (severity) where.severity = severity;
  if (actorId) where.actorId = actorId;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) (where.createdAt as { gte?: Date }).gte = new Date(dateFrom);
    if (dateTo) (where.createdAt as { lte?: Date }).lte = new Date(dateTo);
  }

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const data = entries.map((e) => ({
    id: e.id,
    timestamp: e.createdAt.toISOString(),
    actorId: e.actorId,
    actorName: e.actor?.name ?? e.actor?.email ?? null,
    actorRole: e.actorRole,
    action: e.action,
    category: e.category,
    severity: e.severity,
    success: e.success,
    actorIp: e.actorIp,
    targetType: e.targetType,
    targetId: e.targetId,
    targetLabel: e.targetLabel,
    metadata: e.metadata,
    previousState: e.previousState,
    newState: e.newState,
    errorCode: e.errorCode,
    actorAgent: e.actorAgent,
  }));

  return NextResponse.json({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
