import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { generateUniqueSlug } from "@/lib/companies/slug";
import { z } from "zod";

const createCompanySchema = z.object({
  name: z.string().min(1).max(200),
  industry: z.string().max(100).optional(),
  type: z.enum(["PUBLIC", "PRIVATE", "NGO", "GOVERNMENT", "STARTUP", "OTHER"]).optional(),
  size: z
    .enum([
      "SIZE_1_10",
      "SIZE_11_50",
      "SIZE_51_200",
      "SIZE_201_500",
      "SIZE_501_1000",
      "SIZE_1001_PLUS",
    ])
    .optional(),
  founded: z.number().int().min(1800).max(2100).optional(),
  hq: z.string().max(200).optional(),
  website: z.string().url().max(500).optional().or(z.literal("")),
  mission: z.string().max(1000).optional(),
});

/**
 * GET /api/companies — list with filters, sort, pagination (for discovery).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const industry = searchParams.get("industry") ?? undefined;
  const size = searchParams.get("size") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const minRating = searchParams.get("minRating") ? parseFloat(searchParams.get("minRating")!) : undefined;
  const verifiedOnly = searchParams.get("verifiedOnly") === "true";
  const sort = searchParams.get("sort") ?? "most_reviewed";
  const search = searchParams.get("search")?.trim();

  const where: Record<string, unknown> = {};
  if (industry) where.industry = industry;
  if (size) where.size = size;
  if (type) where.type = type;
  if (verifiedOnly) where.verified = true;
  if (search) where.name = { contains: search, mode: "insensitive" };

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy:
        sort === "alphabetical"
          ? { name: "asc" }
          : sort === "newest"
            ? { createdAt: "desc" }
            : { reviews: { _count: "desc" } },
      include: {
        reviews: {
          where: { status: "APPROVED" },
          select: { overallRating: true },
        },
      },
    }),
    prisma.company.count({ where }),
  ]);

  const items = companies.map((c) => {
    const ratings = c.reviews.map((r) => r.overallRating);
    const overallAvg =
      ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      logo: c.logo,
      industry: c.industry,
      type: c.type,
      size: c.size,
      verified: c.verified,
      reviewCount: c.reviews.length,
      overallRating: overallAvg != null ? Math.round(overallAvg * 10) / 10 : null,
    };
  });

  if (minRating != null && minRating > 0) {
    const filtered = items.filter((i) => i.overallRating != null && i.overallRating >= minRating);
    return NextResponse.json({
      success: true,
      data: filtered,
      meta: { page, limit, total: filtered.length },
    });
  }

  return NextResponse.json({
    success: true,
    data: items,
    meta: { page, limit, total },
  });
}

/**
 * POST /api/companies — create company. RECRUITER or COMPANY_ADMIN role required.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const role = session.user.role as string;
  if (role !== "RECRUITER" && role !== "COMPANY_ADMIN") {
    return NextResponse.json(
      { success: false, error: "RECRUITER or COMPANY_ADMIN role required to create a company" },
      { status: 403 }
    );
  }
  const body = await req.json().catch(() => ({}));
  const parsed = createCompanySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const slug = await generateUniqueSlug(data.name);
  const company = await prisma.company.create({
    data: {
      slug,
      name: data.name,
      industry: data.industry ?? null,
      type: data.type ?? null,
      size: data.size ?? null,
      founded: data.founded ?? null,
      hq: data.hq ?? null,
      website: data.website || null,
      mission: data.mission ?? null,
      claimed: true,
      admins: {
        create: { userId: session.user.id, role: "OWNER" },
      },
    },
    include: {
      admins: { select: { userId: true, role: true } },
    },
  });
  return NextResponse.json({ success: true, data: company }, { status: 201 });
}
