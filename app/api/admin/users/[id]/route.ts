import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      createdAt: true,
      bannedAt: true,
      banReason: true,
      jobSeekerProfile: { select: { completionScore: true, headline: true } },
      jobApplications: {
        orderBy: { submittedAt: "desc" },
        take: 5,
        select: {
          id: true,
          submittedAt: true,
          status: true,
          jobPost: { select: { title: true, slug: true } },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  const recentActivity = await prisma.auditLog.findMany({
    where: { targetId: id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      action: true,
      targetType: true,
      targetLabel: true,
      createdAt: true,
      admin: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({
    ...user,
    profileComplete: user.jobSeekerProfile?.completionScore ?? null,
    recentApplications: user.jobApplications,
    recentActivity,
  });
}
