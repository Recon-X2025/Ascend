import { NextResponse } from "next/server";
import { requireRecruiterSession } from "@/lib/recruiter-intelligence/auth";
import { track } from "@/lib/analytics/track";
import { EVENTS } from "@/lib/analytics/track";

const ALLOWED = new Set<string>([
  EVENTS.RECRUITER_INTELLIGENCE_VIEWED,
  EVENTS.FUNNEL_VIEWED,
  EVENTS.BENCHMARK_VIEWED,
  EVENTS.FIT_EXPLAINER_OPENED,
  EVENTS.SCORECARD_SUBMITTED,
  EVENTS.DI_METRICS_ENABLED,
  EVENTS.DI_METRICS_VIEWED,
]);

export async function POST(req: Request) {
  const auth = await requireRecruiterSession();
  if ("error" in auth) return auth.error;
  let body: { event?: string; properties?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const event = body.event;
  if (!event || !ALLOWED.has(event)) {
    return NextResponse.json({ error: "Invalid or disallowed event" }, { status: 400 });
  }
  await track(event, body.properties ?? {}, { userId: auth.userId });
  return NextResponse.json({ ok: true });
}
