/**
 * M-12: POST withdraw circle application (mentee only).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { withdrawCircleApplication } from "@/lib/mentorship/circles";

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
    await withdrawCircleApplication(circleId, session.user.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to withdraw";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
