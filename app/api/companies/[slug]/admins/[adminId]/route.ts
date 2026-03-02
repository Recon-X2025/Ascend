import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { isCompanyOwnerOrAdmin } from "@/lib/companies/permissions";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; adminId: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { slug, adminId } = await params;
  const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
  if (!company) return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
  if (!(await isCompanyOwnerOrAdmin(userId, company.id)))
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const admin = await prisma.companyAdmin.findFirst({
    where: { id: adminId, companyId: company.id },
    select: { userId: true },
  });
  if (!admin) return NextResponse.json({ success: false, error: "Admin not found" }, { status: 404 });
  const adminCount = await prisma.companyAdmin.count({ where: { companyId: company.id } });
  if (adminCount <= 1 && admin.userId === userId)
    return NextResponse.json(
      { error: "Cannot remove yourself when you are the only admin." },
      { status: 400 }
    );
  await prisma.companyAdmin.delete({ where: { id: adminId } });
  return NextResponse.json({ success: true, message: "Admin removed." });
}
