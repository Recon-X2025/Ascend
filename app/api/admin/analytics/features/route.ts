import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { subDays } from "date-fns";

const FEATURE_EVENTS = [
  "fit_score_viewed",
  "resume_optimised",
  "resume_built",
  "mentor_search_performed",
  "mentor_session_requested",
  "mentor_session_completed",
  "salary_page_viewed",
  "company_page_viewed",
] as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const since = subDays(new Date(), 30);

  const events = await prisma.analyticsEvent.findMany({
    where: { event: { in: [...FEATURE_EVENTS] }, createdAt: { gte: since } },
    select: { event: true, userId: true, persona: true },
  });

  const byEvent = new Map<
    string,
    { total: number; userIds: Set<string>; byPersona: Record<string, number> }
  >();

  for (const e of events) {
    let row = byEvent.get(e.event);
    if (!row) {
      row = { total: 0, userIds: new Set(), byPersona: {} };
      byEvent.set(e.event, row);
    }
    row.total++;
    if (e.userId) row.userIds.add(e.userId);
    const p = e.persona ?? "NO_PERSONA";
    row.byPersona[p] = (row.byPersona[p] ?? 0) + 1;
  }

  const featureLabels: Record<string, string> = {
    fit_score_viewed: "Fit Score",
    resume_optimised: "Resume Optimiser",
    resume_built: "Resume Builder",
    mentor_search_performed: "Mentor Discovery",
    mentor_session_requested: "Mentor Sessions",
    mentor_session_completed: "Mentor Sessions Completed",
    salary_page_viewed: "Salary Pages",
    company_page_viewed: "Company Pages",
  };

  const features = FEATURE_EVENTS.map((event) => {
    const row = byEvent.get(event) ?? { total: 0, userIds: new Set<string>(), byPersona: {} };
    const total = row.total;
    const uniqueUsers = row.userIds.size;
    const byPersona = row.byPersona;
    const topPersona = Object.entries(byPersona).sort((a, b) => b[1] - a[1])[0];
    const topPersonaPct = total > 0 && topPersona ? Math.round((topPersona[1] / total) * 100) : 0;
    return {
      feature: featureLabels[event] ?? event,
      event,
      totalUses: total,
      uniqueUsers,
      topPersona: topPersona?.[0] ?? "—",
      topPersonaPct,
    };
  });

  return NextResponse.json({ features, since: since.toISOString() });
}
