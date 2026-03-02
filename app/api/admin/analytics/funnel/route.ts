import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { subDays, startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const days = Math.min(90, Math.max(7, parseInt(req.nextUrl.searchParams.get("days") ?? "30", 10)));
  const end = new Date();
  const start = subDays(end, days);
  const startDay = startOfDay(start);

  const [registered, personaCompleted, contextCompleted, firstJobView, firstApplication] = await Promise.all([
    prisma.analyticsEvent.count({ where: { event: "user_registered", createdAt: { gte: startDay } } }),
    prisma.analyticsEvent.count({ where: { event: "persona_selected", createdAt: { gte: startDay } } }),
    prisma.analyticsEvent.count({ where: { event: "context_completed", createdAt: { gte: startDay } } }),
    prisma.analyticsEvent.count({ where: { event: "job_viewed", createdAt: { gte: startDay } } }),
    prisma.analyticsEvent.count({ where: { event: "job_applied", createdAt: { gte: startDay } } }),
  ]);

  const registrationToPersona = registered > 0 ? (personaCompleted / registered) * 100 : 0;
  const personaToContext = personaCompleted > 0 ? (contextCompleted / personaCompleted) * 100 : 0;
  const contextToJobView = contextCompleted > 0 ? (firstJobView / contextCompleted) * 100 : 0;
  const jobViewToApplication = firstJobView > 0 ? (firstApplication / firstJobView) * 100 : 0;
  const overallConversion = registered > 0 ? (firstApplication / registered) * 100 : 0;

  return NextResponse.json({
    registered,
    personaCompleted,
    contextCompleted,
    firstJobView,
    firstApplication,
    registrationToPersona: Math.round(registrationToPersona * 10) / 10,
    personaToContext: Math.round(personaToContext * 10) / 10,
    contextToJobView: Math.round(contextToJobView * 10) / 10,
    jobViewToApplication: Math.round(jobViewToApplication * 10) / 10,
    overallConversion: Math.round(overallConversion * 10) / 10,
    days,
  });
}
