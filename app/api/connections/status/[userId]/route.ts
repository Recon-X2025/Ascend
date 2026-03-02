import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

type Params = { params: Promise<{ userId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId: targetUserId } = await params;
  if (!targetUserId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  if (targetUserId === session.user.id) {
    return NextResponse.json({
      success: true,
      data: {
        status: "none" as const,
        connectionId: null,
        type: null,
        isRequester: null,
      },
    });
  }

  const asRequester = await prisma.connection.findUnique({
    where: {
      requesterId_recipientId: {
        requesterId: session.user.id,
        recipientId: targetUserId,
      },
    },
  });
  if (asRequester) {
    return NextResponse.json({
      success: true,
      data: {
        status: asRequester.status,
        connectionId: asRequester.id,
        type: asRequester.type,
        isRequester: true,
      },
    });
  }

  const asRecipient = await prisma.connection.findUnique({
    where: {
      requesterId_recipientId: {
        requesterId: targetUserId,
        recipientId: session.user.id,
      },
    },
  });
  if (asRecipient) {
    return NextResponse.json({
      success: true,
      data: {
        status: asRecipient.status,
        connectionId: asRecipient.id,
        type: asRecipient.type,
        isRequester: false,
      },
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      status: "none" as const,
      connectionId: null,
      type: null,
      isRequester: null,
    },
  });
}
