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

  const report = await prisma.salaryReport.findUnique({
    where: { id },
    select: {
      id: true,
      companyId: true,
      company: { select: { name: true } },
      user: { select: { email: true } },
    },
  });
  if (!report) {
    return NextResponse.json({ error: "Salary submission not found" }, { status: 404 });
  }

  await prisma.salaryReport.update({
    where: { id },
    data: { status: "REJECTED", rejectionReason: reason },
  });

  await logAdminAction({
    adminId: session.user.id,
    action: "REVIEW_REJECTED",
    targetType: "SalaryReport",
    targetId: id,
    targetLabel: `${report.company.name} salary data`,
    metadata: { reason },
  });

  try {
    await sendReviewRejectedEmail(report.user.email, reason, "salary");
  } catch {}

  return NextResponse.json({ id, status: "REJECTED" });
}
