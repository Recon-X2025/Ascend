/**
 * BL-7: POST follow mentor, GET list of mentors I follow.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { followMentor, getFollowingMentors } from "@/lib/mentorship/follow";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const mentorUserId = typeof body.mentorUserId === "string" ? body.mentorUserId.trim() : null;
  if (!mentorUserId) {
    return NextResponse.json({ success: false, error: "mentorUserId required" }, { status: 400 });
  }
  const { ok, error } = await followMentor(session.user.id, mentorUserId);
  if (!ok) {
    return NextResponse.json({ success: false, error: error ?? "Failed to follow" }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const following = await getFollowingMentors(session.user.id);
  return NextResponse.json({ success: true, data: following });
}
