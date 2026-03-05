/**
 * BL-13: Subscribe to mentor newsletter (public).
 */
import { NextResponse } from "next/server";
import { subscribeToNewsletter } from "@/lib/mentorship/creator";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";

export async function POST(req: Request) {
  const body = await req.json();
  const { mentorUserId, email } = body ?? {};
  if (!mentorUserId || !email) return NextResponse.json({ success: false, error: "mentorUserId and email required" }, { status: 400 });
  const session = await getServerSession(authOptions);
  const result = await subscribeToNewsletter(mentorUserId, email, session?.user?.id);
  if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  return NextResponse.json({ success: true });
}
