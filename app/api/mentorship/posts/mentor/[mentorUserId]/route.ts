/**
 * BL-8: GET posts by a specific mentor (public).
 */
import { NextResponse } from "next/server";
import { getPostsByMentor } from "@/lib/mentorship/posts";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mentorUserId: string }> }
) {
  const { mentorUserId } = await params;
  if (!mentorUserId) {
    return NextResponse.json({ success: false, error: "mentorUserId required" }, { status: 400 });
  }
  const posts = await getPostsByMentor(mentorUserId, 20);
  return NextResponse.json({ success: true, data: posts });
}
