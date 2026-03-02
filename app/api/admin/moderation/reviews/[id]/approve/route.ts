import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { logAdminAction } from "@/lib/admin/audit";
import { sendReviewApprovedEmail } from "@/lib/email/templates/review-approved";

export async function PATCH(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  const review = await prisma.companyReview.findUnique({
    where: { id },
    select: {
      id: true,
      companyId: true,
      company: { select: { name: true } },
      user: { select: { email: true } },
    },
  });
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  await prisma.companyReview.update({
    where: { id },
    data: { status: "APPROVED", moderatedAt: new Date(), moderatedById: session.user.id },
  });

  await logAdminAction({
    adminId: session.user.id,
    action: "REVIEW_APPROVED",
    targetType: "CompanyReview",
    targetId: id,
    targetLabel: `${review.company.name} review`,
  });

  if (review.user?.email) {
    try {
      await sendReviewApprovedEmail(review.user.email);
    } catch {}
  }

  return NextResponse.json({ id, status: "APPROVED" });
}
