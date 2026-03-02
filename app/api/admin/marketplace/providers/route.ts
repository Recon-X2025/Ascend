import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import type { ProviderStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status") ?? "PENDING_REVIEW";
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const validStatuses: ProviderStatus[] = ["PENDING_REVIEW", "ACTIVE", "SUSPENDED"];
  const status = validStatuses.includes(statusParam as ProviderStatus) ? (statusParam as ProviderStatus) : "PENDING_REVIEW";
  const where = { status };

  const [items, total] = await Promise.all([
    prisma.marketplaceProvider.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
      skip: page * limit,
      take: limit,
    }),
    prisma.marketplaceProvider.count({ where }),
  ]);

  const list = items.map((p) => ({
    id: p.id,
    userId: p.userId,
    type: p.type,
    status: p.status,
    bio: p.bio,
    specialisations: p.specialisations,
    languages: p.languages,
    pricePerSession: p.pricePerSession,
    currency: p.currency,
    turnaroundHours: p.turnaroundHours,
    calendarUrl: p.calendarUrl,
    adminNote: p.adminNote,
    createdAt: p.createdAt.toISOString(),
    daysWaiting: Math.floor(
      (Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    ),
    user: p.user,
  }));

  return NextResponse.json({ items: list, total });
}
