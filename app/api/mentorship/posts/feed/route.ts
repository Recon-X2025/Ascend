/**
 * BL-8: GET follower feed — posts from mentors the user follows.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { getFeedForFollower } from "@/lib/mentorship/posts";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "50", 10), 1), 100);
  const posts = await getFeedForFollower(session.user.id, limit);
  return NextResponse.json({ success: true, data: posts });
}
