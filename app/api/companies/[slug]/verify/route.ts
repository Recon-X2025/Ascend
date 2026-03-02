import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

/**
 * POST /api/companies/[slug]/verify — set verified=true. Platform Admin only.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Platform admin only" }, { status: 403 });
  }
  const { slug } = await params;
  const company = await prisma.company.findUnique({ where: { slug } });
  if (!company) {
    return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
  }
  await prisma.company.update({
    where: { id: company.id },
    data: { verified: true },
  });
  return NextResponse.json({ success: true, data: { verified: true } });
}
