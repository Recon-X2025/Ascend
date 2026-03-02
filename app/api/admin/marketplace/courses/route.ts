import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const postSchema = z.object({
  skill: z.string().min(1),
  title: z.string().min(1),
  provider: z.string().min(1),
  url: z.string().url(),
  affiliateCode: z.string().optional(),
  priceInr: z.number().int().min(0).optional(),
  durationHours: z.number().int().min(0).optional(),
  level: z.string().optional(),
  language: z.string().default("en"),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const [items, total] = await Promise.all([
    prisma.courseRecommendation.findMany({
      orderBy: { clickCount: "desc" },
      skip: page * limit,
      take: limit,
    }),
    prisma.courseRecommendation.count(),
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
      isActive: c.isActive,
      clickCount: c.clickCount,
      createdAt: c.createdAt.toISOString(),
    })),
    total,
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const parsed = postSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid body", issues: parsed.error.issues }, { status: 400 });

  const course = await prisma.courseRecommendation.create({
    data: {
      skill: parsed.data.skill,
      title: parsed.data.title,
      provider: parsed.data.provider,
      url: parsed.data.url,
      affiliateCode: parsed.data.affiliateCode ?? null,
      priceInr: parsed.data.priceInr ?? null,
      durationHours: parsed.data.durationHours ?? null,
      level: parsed.data.level ?? null,
      language: parsed.data.language,
      isActive: true,
    },
  });

  return NextResponse.json({ course: { id: course.id, title: course.title } });
}
