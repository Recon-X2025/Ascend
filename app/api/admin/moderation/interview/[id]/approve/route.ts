import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { logAdminAction } from "@/lib/admin/audit";

export async function PATCH(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  const review = await prisma.interviewReview.findUnique({
    where: { id },
    select: { id: true, companyId: true, company: { select: { name: true } } },
  });
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  await prisma.interviewReview.update({
    where: { id },
    data: { status: "APPROVED", moderatedAt: new Date(), moderatedById: session.user.id },
  });

  await logAdminAction({
    adminId: session.user.id,
    action: "REVIEW_APPROVED",
    targetType: "InterviewReview",
    targetId: id,
    targetLabel: `${review.company.name} interview review`,
  });

  return NextResponse.json({ id, status: "APPROVED" });
}
