import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { logAdminAction } from "@/lib/admin/audit";
import { sendReviewRejectedEmail } from "@/lib/email/templates/review-rejected";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 5) {
    return NextResponse.json(
      { error: "Reason is required (min 5 characters)" },
      { status: 400 }
    );
  }

  const review = await prisma.interviewReview.findUnique({
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

  await prisma.interviewReview.update({
    where: { id },
    data: { status: "REJECTED", rejectionReason: reason, moderatedAt: new Date(), moderatedById: session.user.id },
  });

  await logAdminAction({
    adminId: session.user.id,
    action: "REVIEW_REJECTED",
    targetType: "InterviewReview",
    targetId: id,
    targetLabel: `${review.company.name} interview review`,
    metadata: { reason },
  });

  try {
    await sendReviewRejectedEmail(review.user.email, reason, "interview");
  } catch {}

  return NextResponse.json({ id, status: "REJECTED" });
}
