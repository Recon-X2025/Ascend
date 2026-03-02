import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { isCompanyOwnerOrAdmin } from "@/lib/companies/permissions";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; benefitId: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug, benefitId } = await params;
  const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });
  if (!(await isCompanyOwnerOrAdmin(userId, company.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const benefit = await prisma.companyBenefit.findFirst({
    where: { id: benefitId, companyId: company.id },
  });
  if (!benefit) return NextResponse.json({ error: "Benefit not found" }, { status: 404 });
  await prisma.companyBenefit.delete({ where: { id: benefitId } });
  return NextResponse.json({ message: "Benefit removed." });
}
