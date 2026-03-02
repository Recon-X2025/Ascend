import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

const startOfToday = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const today = startOfToday();

  const [
    pendingCompany,
    pendingInterview,
    pendingSalary,
    approvedTodayCompany,
    rejectedTodayCompany,
    approvedTodayInterview,
    rejectedTodayInterview,
    approvedTodaySalary,
    rejectedTodaySalary,
  ] = await Promise.all([
    prisma.companyReview.count({ where: { status: "PENDING" } }),
    prisma.interviewReview.count({ where: { status: "PENDING" } }),
    prisma.salaryReport.count({ where: { status: "PENDING" } }),
    prisma.companyReview.count({
      where: { status: "APPROVED", moderatedAt: { gte: today } },
    }),
    prisma.companyReview.count({
      where: { status: "REJECTED", moderatedAt: { gte: today } },
    }),
    prisma.interviewReview.count({
      where: { status: "APPROVED", moderatedAt: { gte: today } },
    }),
    prisma.interviewReview.count({
      where: { status: "REJECTED", moderatedAt: { gte: today } },
    }),
    prisma.salaryReport.count({
      where: { status: "APPROVED", createdAt: { gte: today } },
    }),
    prisma.salaryReport.count({
      where: { status: "REJECTED", createdAt: { gte: today } },
    }),
  ]);

  const pending = pendingCompany + pendingInterview + pendingSalary;
  const approvedToday = approvedTodayCompany + approvedTodayInterview + approvedTodaySalary;
  const rejectedToday = rejectedTodayCompany + rejectedTodayInterview + rejectedTodaySalary;

  return NextResponse.json({
    pending,
    approvedToday,
    rejectedToday,
  });
}
