import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ pendingConnections: 0, unreadMessages: 0, unseenSignals: 0 });
  }

  const userId = session.user.id;

  const [pendingConnections, unreadMessages, unseenSignals] = await Promise.all([
    prisma.connection.count({
      where: { recipientId: userId, status: "PENDING" },
    }),
    prisma.message.count({
      where: {
        readAt: null,
        senderId: { not: userId },
        conversation: {
          OR: [{ participantA: userId }, { participantB: userId }],
        },
      },
    }),
    prisma.careerSignal.count({
      where: { userId, seen: false },
    }),
  ]);

  return NextResponse.json({
    pendingConnections,
    unreadMessages,
    unseenSignals,
  });
}
