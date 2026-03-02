import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { logAdminAction } from "@/lib/admin/audit";
import { invalidateCacheByPrefix } from "@/lib/salary/cache";
import { roleToSlug } from "@/lib/salary/normalize";

export async function PATCH(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  const report = await prisma.salaryReport.findUnique({
    where: { id },
    select: { id: true, companyId: true, jobTitle: true, company: { select: { name: true } } },
  });
  if (!report) {
    return NextResponse.json({ error: "Salary submission not found" }, { status: 404 });
  }

  await prisma.salaryReport.update({
    where: { id },
    data: { status: "APPROVED" },
  });

  await Promise.all([
    invalidateCacheByPrefix(`role:${roleToSlug(report.jobTitle)}`),
    invalidateCacheByPrefix(`company:${report.companyId}`),
    invalidateCacheByPrefix("toppayers:"),
  ]).catch(() => {});

  await logAdminAction({
    adminId: session.user.id,
    action: "REVIEW_APPROVED",
    targetType: "SalaryReport",
    targetId: id,
    targetLabel: `${report.company.name} salary data`,
  });

  return NextResponse.json({ id, status: "APPROVED" });
}
