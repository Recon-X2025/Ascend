/**
 * M-12: POST initialise circle engagement (mentor only).
 * Creates CircleSessions, links member sessions, increments capacity.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { initialiseCircleEngagement } from "@/lib/mentorship/circles";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ circleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { circleId } = await params;

  try {
    await initialiseCircleEngagement(circleId, session.user.id);
    return NextResponse.json({ success: true, status: "ACTIVE" });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to initialise engagement";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
