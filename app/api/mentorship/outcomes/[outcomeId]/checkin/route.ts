import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { z } from "zod";
import { submitCheckIn } from "@/lib/mentorship/outcomes";

const bodySchema = z.object({
  note: z.string().min(1).max(2000),
});

/**
 * POST /api/mentorship/outcomes/[outcomeId]/checkin — Mentee submits 6-month check-in.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ outcomeId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { outcomeId } = await params;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ success: false, error: "Invalid body", details: e }, { status: 400 });
  }

  try {
    const outcome = await submitCheckIn(outcomeId, session.user.id, body.note);
    return NextResponse.json({
      outcome: {
        id: outcome.id,
        checkInStatus: outcome.checkInStatus,
        checkInCompletedAt: outcome.checkInCompletedAt?.toISOString() ?? null,
        checkInBadgeGranted: outcome.checkInBadgeGranted,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    if (message === "Forbidden" || message === "Outcome not found") {
      return NextResponse.json({ success: false, error: message }, { status: 403 });
    }
    if (message.includes("not yet due") || message.includes("already completed")) {
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
