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
  const category = searchParams.get("category");
  const severity = searchParams.get("severity");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const actorId = searchParams.get("actorId")?.trim() ?? null;
  const limit = Math.min(10000, Math.max(1, parseInt(searchParams.get("limit") ?? "1000", 10)));

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (severity) where.severity = severity;
  if (actorId) where.actorId = actorId;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) (where.createdAt as { gte?: Date }).gte = new Date(dateFrom);
    if (dateTo) (where.createdAt as { lte?: Date }).lte = new Date(dateTo);
  }

  const entries = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: { select: { id: true, name: true, email: true } } },
  });

  const escape = (v: unknown): string => {
    if (v == null) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const headers = ["id", "timestamp", "actorId", "actorName", "actorRole", "action", "category", "severity", "success", "actorIp", "targetType", "targetId", "targetLabel", "errorCode"];
  const rows = entries.map((e) =>
    [e.id, e.createdAt.toISOString(), e.actorId ?? "", e.actor?.name ?? e.actor?.email ?? "", e.actorRole ?? "", e.action, e.category, e.severity, e.success ? "true" : "false", e.actorIp ?? "", e.targetType, e.targetId, e.targetLabel ?? "", e.errorCode ?? ""].map(escape).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=audit-log-export.csv",
    },
  });
}
