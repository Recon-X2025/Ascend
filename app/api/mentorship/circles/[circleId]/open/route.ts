/**
 * M-12: POST open circle for applications (mentor only).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { openCircle } from "@/lib/mentorship/circles";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ circleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { circleId } = await params;

  try {
    await openCircle(circleId, session.user.id);
    return NextResponse.json({ success: true, status: "OPEN" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to open circle";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
