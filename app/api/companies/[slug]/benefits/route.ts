import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { isCompanyOwnerOrAdmin } from "@/lib/companies/permissions";
import { z } from "zod";

const schema = z.object({
  label: z.string().min(1).max(200),
  emoji: z.string().max(20).optional().nullable(),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug } = await params;
  const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });
  if (!(await isCompanyOwnerOrAdmin(userId, company.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "label required" }, { status: 400 });
  const maxOrder = await prisma.companyBenefit
    .findFirst({
      where: { companyId: company.id },
      orderBy: { order: "desc" },
      select: { order: true },
    })
    .then((r) => (r ? r.order : -1));
  const benefit = await prisma.companyBenefit.create({
    data: {
      companyId: company.id,
      label: parsed.data.label,
      icon: parsed.data.emoji ?? null,
      order: maxOrder + 1,
    },
  });
  return NextResponse.json({
    id: benefit.id,
    label: benefit.label,
    emoji: benefit.icon,
    order: benefit.order,
  });
}
