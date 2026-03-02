import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";

/**
 * POST /api/companies/[slug]/claim — claim an unclaimed company. Creates CompanyAdmin OWNER.
 * Only one active claim per company (claimed becomes true).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const company = await prisma.company.findUnique({ where: { slug } });
  if (!company) {
    return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
  }
  if (company.claimed) {
    return NextResponse.json(
      { success: false, error: "Company is already claimed" },
      { status: 400 }
    );
  }
  const existing = await prisma.companyAdmin.findUnique({
    where: { companyId_userId: { companyId: company.id, userId } },
  });
  if (existing) {
    await prisma.company.update({
      where: { id: company.id },
      data: { claimed: true },
    });
    return NextResponse.json({ success: true, data: { alreadyAdmin: true } });
  }
  await prisma.$transaction([
    prisma.company.update({
      where: { id: company.id },
      data: { claimed: true },
    }),
    prisma.companyAdmin.create({
      data: { companyId: company.id, userId, role: "OWNER" },
    }),
  ]);
  return NextResponse.json({ success: true, data: { claimed: true } });
}
