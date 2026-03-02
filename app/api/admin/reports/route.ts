import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import type { ReportStatus, ReportTargetType } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as ReportStatus | null;
  const targetType = searchParams.get("targetType") as ReportTargetType | null;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const where: { status?: ReportStatus; targetType?: ReportTargetType } = {};
  if (status) where.status = status;
  if (targetType) where.targetType = targetType;

  const [reports, total] = await Promise.all([
    prisma.userReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        reporter: { select: { id: true, role: true } },
      },
    }),
    prisma.userReport.count({ where }),
  ]);

  const items = reports.map((r) => ({
    id: r.id,
    targetType: r.targetType,
    targetId: r.targetId,
    reason: r.reason,
    description: r.description,
    status: r.status,
    resolution: r.resolution,
    resolvedAt: r.resolvedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    reporter: { id: r.reporter.id, role: r.reporter.role },
  }));

  return NextResponse.json({
    reports: items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
