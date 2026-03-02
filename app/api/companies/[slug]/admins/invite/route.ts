import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { isCompanyOwnerOrAdmin } from "@/lib/companies/permissions";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { slug } = await params;
  const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
  if (!company) return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
  if (!(await isCompanyOwnerOrAdmin(userId, company.id)))
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: "Valid email required" }, { status: 400 });
  const email = parsed.data.email.toLowerCase().trim();
  await prisma.companyInvite.upsert({
    where: { companyId_email: { companyId: company.id, email } },
    create: { companyId: company.id, email, invitedBy: userId, status: "PENDING" },
    update: { invitedBy: userId, status: "PENDING" },
  });
  return NextResponse.json({ success: true, message: "Invite sent." });
}
