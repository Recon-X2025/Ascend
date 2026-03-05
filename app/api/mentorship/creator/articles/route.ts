/**
 * BL-13: Creator Mode — articles CRUD (mentors only).
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { createArticle, listArticlesByMentor } from "@/lib/mentorship/creator";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const mentorUserId = searchParams.get("mentorUserId") ?? session.user.id;
  const publishedOnly = searchParams.get("publishedOnly") === "true";
  const articles = await listArticlesByMentor(mentorUserId, publishedOnly);
  return NextResponse.json({ success: true, data: articles });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { title, content, excerpt } = body ?? {};
  const result = await createArticle(session.user.id, { title, content, excerpt });
  if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, data: result.article });
}
