import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const [userCount, companyCount, jobCount, applicationCount, pendingReviews] =
    await Promise.all([
      prisma.user.count(),
      prisma.company.count(),
      prisma.jobPost.count({ where: { status: "ACTIVE" } }),
      prisma.jobApplication.count(),
      prisma.companyReview.count({ where: { status: "PENDING" } }),
    ]);

  return NextResponse.json({
    userCount,
    companyCount,
    jobCount,
    applicationCount,
    pendingReviews,
  });
}
