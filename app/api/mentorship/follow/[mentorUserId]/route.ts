/**
 * BL-7: DELETE unfollow mentor, GET follow status for a mentor.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { unfollowMentor, isFollowing, getFollowerCount } from "@/lib/mentorship/follow";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ mentorUserId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { mentorUserId } = await params;
  await unfollowMentor(session.user.id, mentorUserId);
  return NextResponse.json({ success: true });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mentorUserId: string }> }
) {
  const session = await getServerSession(authOptions);
  const { mentorUserId } = await params;
  const [following, followerCount] = await Promise.all([
    session?.user?.id ? isFollowing(session.user.id, mentorUserId) : false,
    getFollowerCount(mentorUserId),
  ]);
  return NextResponse.json({
    success: true,
    data: { following, followerCount },
  });
}
