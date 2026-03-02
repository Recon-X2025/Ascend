/**
 * M-12: POST decline circle application (mentor only).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { declineCircleApplication } from "@/lib/mentorship/circles";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ circleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { circleId } = await params;

  let body: { memberId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.memberId) {
    return NextResponse.json(
      { error: "memberId required" },
      { status: 400 }
    );
  }

  try {
    await declineCircleApplication(circleId, body.memberId, session.user.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to decline";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
