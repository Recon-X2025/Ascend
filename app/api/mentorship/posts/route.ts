/**
 * BL-8: POST create mentor post.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { createPost } from "@/lib/mentorship/posts";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const content = typeof body.content === "string" ? body.content : "";
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : null;

  const result = await createPost(session.user.id, content, imageUrl);
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error ?? "Failed to create post" },
      { status: 400 }
    );
  }
  return NextResponse.json({ success: true, postId: result.postId });
}
