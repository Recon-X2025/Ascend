/**
 * BL-9: GET threads, POST create thread.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { getThreads, createThread, isMember } from "@/lib/cohorts";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const cohort = await prisma.cohort.findUnique({ where: { slug } });
  if (!cohort) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  const threads = await getThreads(cohort.id);
  return NextResponse.json({
    success: true,
    data: threads.map((t) => ({
      id: t.id,
      content: t.content,
      createdAt: t.createdAt.toISOString(),
      authorName: t.author.name,
      authorImage: t.author.image,
    })),
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const cohort = await prisma.cohort.findUnique({ where: { slug } });
  if (!cohort) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  const member = await isMember(cohort.id, session.user.id);
  if (!member) {
    return NextResponse.json({ success: false, error: "Join cohort first" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ success: false, error: "content required" }, { status: 400 });
  }
  const thread = await createThread(cohort.id, session.user.id, content);
  return NextResponse.json({
    success: true,
    data: {
      id: thread.id,
      content: thread.content,
      createdAt: thread.createdAt.toISOString(),
      authorName: thread.author.name,
      authorImage: thread.author.image,
    },
  });
}
