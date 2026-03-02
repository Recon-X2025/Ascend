import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { getMenteeEngagementSummary } from "@/lib/mentorship/analytics";
import { trackOutcome } from "@/lib/tracking/outcomes";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await getMenteeEngagementSummary(session.user.id);

  trackOutcome(session.user.id, "M17_MENTEE_ANALYTICS_VIEWED", {
    entityType: "mentee_analytics",
    metadata: { view: "me" },
  });

  return NextResponse.json(summary);
}
