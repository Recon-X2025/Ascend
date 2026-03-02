import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      userA: { select: { id: true, name: true, image: true } },
      userB: { select: { id: true, name: true, image: true } },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const isParticipant =
    conversation.participantA === session.user.id ||
    conversation.participantB === session.user.id;
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const page = Math.max(1, parseInt(new URL(req.url).searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(new URL(req.url).searchParams.get("limit") ?? "50", 10)));
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
      include: {
        sender: { select: { id: true, name: true, image: true } },
        jobPost: { select: { id: true, slug: true, title: true } },
        company: { select: { id: true, slug: true, name: true } },
      },
    }),
    prisma.message.count({ where: { conversationId: id } }),
  ]);

  await prisma.message.updateMany({
    where: {
      conversationId: id,
      senderId: { not: session.user.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  const other =
    conversation.participantA === session.user.id ? conversation.userB : conversation.userA;

  return NextResponse.json({
    success: true,
    data: {
      id: conversation.id,
      other: { id: other.id, name: other.name, image: other.image },
      messages: messages.map((m) => ({
        id: m.id,
        body: m.body,
        senderId: m.senderId,
        sender: m.sender,
        jobPostId: m.jobPostId,
        jobPost: m.jobPost,
        companyId: m.companyId,
        company: m.company,
        readAt: m.readAt,
        createdAt: m.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
}
