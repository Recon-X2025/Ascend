import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const specialisation = searchParams.get("specialisation") ?? undefined;
  const sort = searchParams.get("sort") ?? "rating";
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const where = {
    status: "ACTIVE" as const,
    type: "CAREER_COACH" as const,
    isAvailable: true,
    ...(specialisation && { specialisations: { has: specialisation } }),
  };

  const orderBy = sort === "price_asc" ? { pricePerSession: "asc" as const } : { avgRating: "desc" as const };

  const [items, total] = await Promise.all([
    prisma.marketplaceProvider.findMany({
      where,
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy,
      skip: page * limit,
      take: limit,
    }),
    prisma.marketplaceProvider.count({ where }),
  ]);

  const list = items.map((p) => ({
    id: p.id,
    type: p.type,
    bio: p.bio,
    specialisations: p.specialisations,
    languages: p.languages,
    pricePerSession: p.pricePerSession,
    currency: p.currency,
    avgRating: p.avgRating,
    totalReviews: p.totalReviews,
    calendarUrl: p.calendarUrl,
    user: p.user,
  }));

  return NextResponse.json({ items: list, total });
}
