import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { track, EVENTS } from "@/lib/analytics/track";
import { z } from "zod";

const bodySchema = z.object({
  source: z.string().max(200).optional(),
  medium: z.string().max(200).optional(),
  campaign: z.string().max(200).optional(),
  entityId: z.string().max(200).optional(),
});

/** Log UTM visit to AnalyticsEvent. Call from client when page has utm_* params. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const { source, medium, campaign, entityId } = parsed.data;
  await track(
    EVENTS.UTM_VISIT,
    { source: source ?? null, medium: medium ?? null, campaign: campaign ?? null, entityId: entityId ?? null },
    { userId: session?.user?.id }
  );
  return NextResponse.json({ success: true });
}
