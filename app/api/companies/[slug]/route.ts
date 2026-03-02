import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { isCompanyOwnerOrAdmin } from "@/lib/companies/permissions";
import { getCompanyRatingAggregate } from "@/lib/companies/ratings";
import { z } from "zod";

const updateCompanySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  logo: z.string().max(2000).optional().nullable(),
  banner: z.string().max(2000).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  type: z.enum(["PUBLIC", "PRIVATE", "NGO", "GOVERNMENT", "STARTUP", "OTHER"]).optional().nullable(),
  size: z.enum(["SIZE_1_10", "SIZE_11_50", "SIZE_51_200", "SIZE_201_500", "SIZE_501_1000", "SIZE_1001_PLUS"]).optional().nullable(),
  founded: z.number().int().min(1800).max(2100).optional().nullable(),
  hq: z.string().max(200).optional().nullable(),
  website: z.string().url().max(500).optional().nullable().or(z.literal("")),
  linkedin: z.string().url().max(500).optional().nullable().or(z.literal("")),
  twitter: z.string().url().max(500).optional().nullable().or(z.literal("")),
  facebook: z.string().url().max(500).optional().nullable().or(z.literal("")),
  instagram: z.string().url().max(500).optional().nullable().or(z.literal("")),
  glassdoor: z.string().url().max(500).optional().nullable().or(z.literal("")),
  mission: z.string().max(1000).optional().nullable(),
  about: z.string().max(50000).optional().nullable(),
  specialties: z.array(z.string().max(100)).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      media: { orderBy: { order: "asc" } },
      benefits: { orderBy: { order: "asc" }, include: { ratings: { select: { rating: true } } } },
    },
  });
  if (!company) return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
  const ratingAgg = await getCompanyRatingAggregate(company.id);
  const userId = await getSessionUserId();
  let isAdmin = false;
  if (userId) isAdmin = await isCompanyOwnerOrAdmin(userId, company.id);
  const benefitsWithAvg = company.benefits.map((b) => {
    const ratings = b.ratings.map((r) => r.rating);
    const avg = ratings.length ? ratings.reduce((a, n) => a + n, 0) / ratings.length : null;
    return { id: b.id, label: b.label, icon: b.icon, order: b.order, avgRating: avg };
  });
  return NextResponse.json({
    success: true,
    data: { ...company, ratingAggregate: ratingAgg, benefits: benefitsWithAvg, isAdmin },
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { slug } = await params;
  const company = await prisma.company.findUnique({ where: { slug } });
  if (!company) return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
  const allowed = await isCompanyOwnerOrAdmin(userId, company.id);
  if (!allowed) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const parsed = updateCompanySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const data = parsed.data as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  const allowedKeys = ["name", "logo", "banner", "industry", "type", "size", "founded", "hq", "website", "linkedin", "twitter", "facebook", "instagram", "glassdoor", "mission", "about", "specialties"];
  for (const key of allowedKeys) if (data[key] !== undefined) update[key] = data[key];
  const updated = await prisma.company.update({
    where: { id: company.id },
    data: update,
    include: { media: { orderBy: { order: "asc" } }, benefits: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json({ success: true, data: updated });
}
