import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { notifyConnectionRequest } from "@/lib/notifications/create";
import { z } from "zod";

const bodySchema = z.object({
  recipientId: z.string().min(1),
  type: z.enum(["PEER", "MENTOR", "COLLEAGUE", "INTERVIEWER"]).optional().default("PEER"),
  contextTag: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { recipientId, type, contextTag } = parsed.data;

  if (recipientId === session.user.id) {
    return NextResponse.json({ success: false, error: "Cannot connect with yourself" }, { status: 400 });
  }

  const existing = await prisma.connection.findUnique({
    where: {
      requesterId_recipientId: {
        requesterId: session.user.id,
        recipientId,
      },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Connection or request already exists", status: existing.status },
      { status: 409 }
    );
  }

  const reverse = await prisma.connection.findUnique({
    where: {
      requesterId_recipientId: {
        requesterId: recipientId,
        recipientId: session.user.id,
      },
    },
  });
  if (reverse) {
    return NextResponse.json(
      { error: "Connection or request already exists", status: reverse.status },
      { status: 409 }
    );
  }

  const connection = await prisma.connection.create({
    data: {
      requesterId: session.user.id,
      recipientId,
      type,
      contextTag: contextTag || null,
      status: "PENDING",
    },
    include: {
      recipient: { select: { name: true } },
    },
  });

  await notifyConnectionRequest(
    recipientId,
    connection.recipient.name ?? "Someone",
    connection.id
  );

  return NextResponse.json({ success: true, data: connection }, { status: 201 });
}
