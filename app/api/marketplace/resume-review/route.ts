import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const specialisation = searchParams.get("specialisation") ?? undefined;
  const language = searchParams.get("language") ?? undefined;
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const maxTurnaround = searchParams.get("maxTurnaround");
  const sort = searchParams.get("sort") ?? "rating";
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const priceGte = minPrice != null && minPrice !== "" ? parseInt(minPrice, 10) : undefined;
  const priceLte = maxPrice != null && maxPrice !== "" ? parseInt(maxPrice, 10) : undefined;
  const where = {
    status: "ACTIVE" as const,
    type: "RESUME_REVIEWER" as const,
    isAvailable: true,
    ...(specialisation && { specialisations: { has: specialisation } }),
    ...(language && { languages: { has: language } }),
    ...((priceGte != null || priceLte != null) && { pricePerSession: { ...(priceGte != null && { gte: priceGte }), ...(priceLte != null && { lte: priceLte }) } }),
    ...(maxTurnaround != null && maxTurnaround !== "" && { turnaroundHours: { lte: parseInt(maxTurnaround, 10) } }),
  };
  const orderBy: { avgRating?: "desc" | "asc"; pricePerSession?: "asc" | "desc"; turnaroundHours?: "asc" } =
    sort === "price_asc"
      ? { pricePerSession: "asc" }
      : sort === "turnaround"
      ? { turnaroundHours: "asc" }
      : { avgRating: "desc" };

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
    turnaroundHours: p.turnaroundHours,
    user: p.user,
  }));

  return NextResponse.json({ items: list, total });
}
