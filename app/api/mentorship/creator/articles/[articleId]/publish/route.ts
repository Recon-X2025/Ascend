/**
 * BL-13: Publish article (mentors only).
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { publishArticle } from "@/lib/mentorship/creator";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ articleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { articleId } = await params;
  const result = await publishArticle(session.user.id, articleId);
  if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  return NextResponse.json({ success: true });
}
