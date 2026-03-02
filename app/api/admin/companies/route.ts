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
  const search = searchParams.get("search")?.trim() ?? "";
  const verified = searchParams.get("verified");
  const suspended = searchParams.get("suspended");
  const cursor = searchParams.get("cursor") ?? "";
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }
  if (verified === "true") where.verified = true;
  else if (verified === "false") where.verified = false;
  if (suspended === "true") where.suspendedAt = { not: null };
  else if (suspended === "false") where.suspendedAt = null;

  const companies = await prisma.company.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      industry: true,
      verified: true,
      suspendedAt: true,
      suspensionReason: true,
      createdAt: true,
      _count: { select: { jobPosts: true, reviews: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = companies.length > limit;
  const items = hasMore ? companies.slice(0, limit) : companies;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  const list = items.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    logo: c.logo,
    industry: c.industry,
    verified: c.verified,
    suspendedAt: c.suspendedAt,
    suspensionReason: c.suspensionReason,
    createdAt: c.createdAt,
    jobCount: c._count.jobPosts,
    reviewCount: c._count.reviews,
  }));

  return NextResponse.json({
    companies: list,
    nextCursor,
    hasMore: !!nextCursor,
  });
}
