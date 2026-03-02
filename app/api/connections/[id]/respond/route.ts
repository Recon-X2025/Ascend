import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { emitSignal } from "@/lib/signals/emit";
import { z } from "zod";

const bodySchema = z.object({
  action: z.enum(["accept", "decline", "withdraw"]),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { action } = parsed.data;

  const connection = await prisma.connection.findUnique({ where: { id } });
  if (!connection) {
    return NextResponse.json({ success: false, error: "Connection not found" }, { status: 404 });
  }

  if (connection.status !== "PENDING") {
    return NextResponse.json({ success: false, error: "Request already responded" }, { status: 400 });
  }

  if (action === "withdraw") {
    if (connection.requesterId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Only requester can withdraw" }, { status: 403 });
    }
    await prisma.connection.update({
      where: { id },
      data: { status: "WITHDRAWN" },
    });
    return NextResponse.json({ success: true, data: { status: "WITHDRAWN" } });
  }

  if (action === "accept" || action === "decline") {
    if (connection.recipientId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Only recipient can accept or decline" }, { status: 403 });
    }

    const status = action === "accept" ? "ACCEPTED" : "DECLINED";
    const updateData: { status: "ACCEPTED" | "DECLINED"; connectedAt?: Date } = { status };
    if (action === "accept") updateData.connectedAt = new Date();

    const updated = await prisma.connection.update({
      where: { id },
      data: updateData,
    });

    if (action === "accept") {
      const requesterConnections = await prisma.connection.findMany({
        where: {
          OR: [
            { requesterId: connection.requesterId },
            { recipientId: connection.requesterId },
          ],
          status: "ACCEPTED",
          id: { not: id },
        },
        select: { requesterId: true, recipientId: true },
      });
      const recipientConnections = await prisma.connection.findMany({
        where: {
          OR: [
            { requesterId: connection.recipientId },
            { recipientId: connection.recipientId },
          ],
          status: "ACCEPTED",
          id: { not: id },
        },
        select: { requesterId: true, recipientId: true },
      });
      const requesterNetworkIds = new Set<string>();
      requesterConnections.forEach((c) => {
        requesterNetworkIds.add(
          c.requesterId === connection.requesterId ? c.recipientId : c.requesterId
        );
      });
      const recipientNetworkIds = new Set<string>();
      recipientConnections.forEach((c) => {
        recipientNetworkIds.add(
          c.requesterId === connection.recipientId ? c.recipientId : c.requesterId
        );
      });
      const audienceRequester = Array.from(requesterNetworkIds).filter((u) => u !== connection.recipientId);
      const audienceRecipient = Array.from(recipientNetworkIds).filter((u) => u !== connection.requesterId);
      await emitSignal({
        type: "NETWORK_JOIN",
        actorId: connection.requesterId,
        audienceUserIds: audienceRecipient,
        metadata: { recipientId: connection.recipientId },
      });
      await emitSignal({
        type: "NETWORK_JOIN",
        actorId: connection.recipientId,
        audienceUserIds: audienceRequester,
        metadata: { recipientId: connection.requesterId },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  }

  return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
}
