/**
 * M-12: POST apply to circle.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { applyToCircle, ApplyToCircleSchema } from "@/lib/mentorship/circles";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ circleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { circleId } = await params;

  let body: unknown = {};
  try {
    body = await _req.json();
  } catch {
    // empty body ok
  }

  const parsed = ApplyToCircleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await applyToCircle(circleId, session.user.id, parsed.data);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to apply";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
