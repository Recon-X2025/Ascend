import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const skill = searchParams.get("skill") ?? undefined;
  const provider = searchParams.get("provider") ?? undefined;
  const level = searchParams.get("level") ?? undefined;
  const language = searchParams.get("language") ?? undefined;
  const freeOnly = searchParams.get("freeOnly") === "true";
  const sort = searchParams.get("sort") ?? "clicks";
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const where: { isActive: boolean; skill?: string; provider?: string; level?: string; language?: string; priceInr?: number } = {
    isActive: true,
  };
  if (skill) where.skill = skill;
  if (provider) where.provider = provider;
  if (level) where.level = level;
  if (language) where.language = language;
  if (freeOnly) where.priceInr = 0;

  const orderBy = sort === "clicks" ? { clickCount: "desc" as const } : { title: "asc" as const };

  const [items, total] = await Promise.all([
    prisma.courseRecommendation.findMany({
      where,
      orderBy,
      skip: page * limit,
      take: limit,
    }),
    prisma.courseRecommendation.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map((c) => ({
      id: c.id,
      skill: c.skill,
      title: c.title,
      provider: c.provider,
      url: c.url,
      affiliateCode: c.affiliateCode,
      priceInr: c.priceInr,
      durationHours: c.durationHours,
      level: c.level,
      language: c.language,
      clickCount: c.clickCount,
    })),
    total,
  });
}
