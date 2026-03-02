import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { notifyMessageReceived } from "@/lib/notifications/create";
import { sortedParticipantIds } from "@/lib/messages/helpers";
import { z } from "zod";

const startSchema = z.object({
  recipientId: z.string().min(1),
  body: z.string().min(1).max(10000),
  jobPostId: z.number().int().optional(),
  companyId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const parsed = startSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { recipientId, body, jobPostId, companyId } = parsed.data;

  if (recipientId === session.user.id) {
    return NextResponse.json({ success: false, error: "Cannot message yourself" }, { status: 400 });
  }

  const [sender, connection] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    }),
    prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: session.user.id, recipientId },
          { requesterId: recipientId, recipientId: session.user.id },
        ],
        status: "ACCEPTED",
      },
    }),
  ]);

  if (sender?.role === "RECRUITER" && !connection && !jobPostId) {
    return NextResponse.json(
      {
        error: "RECRUITER_MUST_ATTACH_JOB",
        message:
          "Please attach a job posting to initiate contact with someone outside your network.",
      },
      { status: 400 }
    );
  }

  const [participantA, participantB] = sortedParticipantIds(session.user.id, recipientId);

  let conversation = await prisma.conversation.findUnique({
    where: { participantA_participantB: { participantA, participantB } },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const cleanBody = body.replace(/<[^>]*>/g, "").trim();
  if (!cleanBody) {
    return NextResponse.json({ success: false, error: "Message body required" }, { status: 400 });
  }

  if (!conversation) {
    const created = await prisma.conversation.create({
      data: { participantA, participantB },
    });
    conversation = { ...created, messages: [] };
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: session.user.id,
      body: cleanBody,
      jobPostId: jobPostId ?? null,
      companyId: companyId ?? null,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  await notifyMessageReceived(
    recipientId,
    (session.user as { name?: string }).name ?? "Someone",
    conversation.id
  );

  return NextResponse.json(
    { success: true, data: { conversationId: conversation.id, message } },
    { status: 201 }
  );
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: {
        OR: [{ participantA: session.user.id }, { participantB: session.user.id }],
      },
      orderBy: { lastMessageAt: "desc" },
      skip,
      take: limit,
      include: {
        userA: { select: { id: true, name: true, image: true } },
        userB: { select: { id: true, name: true, image: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { body: true, createdAt: true, senderId: true, readAt: true },
        },
      },
    }),
    prisma.conversation.count({
      where: {
        OR: [{ participantA: session.user.id }, { participantB: session.user.id }],
      },
    }),
  ]);

  const unreadCounts = await Promise.all(
    conversations.map(async (c) => {
      const count = await prisma.message.count({
        where: {
          conversationId: c.id,
          senderId: { not: session.user!.id },
          readAt: null,
        },
      });
      return count;
    })
  );

  const data = conversations.map((c, i) => {
    const other = c.participantA === session.user!.id ? c.userB : c.userA;
    const last = c.messages[0];
    return {
      id: c.id,
      other: { id: other.id, name: other.name, image: other.image },
      lastMessage: last
        ? {
            body: last.body,
            createdAt: last.createdAt,
            fromMe: last.senderId === session.user!.id,
            read: !!last.readAt,
          }
        : null,
      lastMessageAt: c.lastMessageAt,
      unreadCount: unreadCounts[i],
    };
  });

  return NextResponse.json({
    success: true,
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  });
}
