import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { logAudit } from "@/lib/audit/log";
import { getRequestContext } from "@/lib/audit/context";
import { dataExportQueue, accountDeletionQueue } from "@/lib/queues";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { sendDataExportRequestedEmail } from "@/lib/email/templates/data-export-requested";
import { sendAccountDeletionRequestedEmail } from "@/lib/email/templates/account-deletion-requested";
import { isIpBlocked } from "@/lib/blocklist";
import { z } from "zod";
import type { DataRequestType } from "@prisma/client";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const postSchema = z.object({
  type: z.enum(["EXPORT", "DELETE", "RECTIFY"]),
});

export async function POST(req: Request) {
  const { actorIp } = getRequestContext(req);
  if (actorIp && (await isIpBlocked(actorIp))) {
    return NextResponse.json(
      { code: "IP_BLOCKED", message: "Access denied" },
      { status: 403 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const type = parsed.data.type as DataRequestType;

  const since = new Date(Date.now() - THIRTY_DAYS_MS);
  const recent = await prisma.dataRequest.findFirst({
    where: {
      userId,
      type,
      OR: [
        { status: "PENDING" },
        { status: "PROCESSING" },
        { status: "COMPLETED", completedAt: { gte: since } },
      ],
    },
  });
  if (recent) {
    return NextResponse.json(
      {
        error: "You already have a pending or recent request of this type. Please wait 30 days between requests.",
        code: "RECENT_REQUEST",
      },
      { status: 429 }
    );
  }

  const dataRequest = await prisma.dataRequest.create({
    data: {
      userId,
      type,
      status: "PENDING",
    },
  });

  if (type === "EXPORT") {
    await dataExportQueue.add("export", {
      dataRequestId: dataRequest.id,
      userId,
    });
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      if (user?.email) {
        await sendDataExportRequestedEmail(user.email, user.name ?? "User");
      }
    } catch (e) {
      console.error("[data-request] sendDataExportRequestedEmail failed:", e);
    }
    trackOutcome(userId, "PHASE17_DATA_EXPORT_REQUESTED", {
      entityId: dataRequest.id,
      entityType: "DataRequest",
      metadata: { type: "EXPORT" },
    }).catch(() => {});
  }

  if (type === "DELETE") {
    await accountDeletionQueue.add("delete", {
      dataRequestId: dataRequest.id,
      userId,
    });
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      if (user?.email) {
        await sendAccountDeletionRequestedEmail(user.email, user.name ?? "User");
      }
    } catch (e) {
      console.error("[data-request] sendAccountDeletionRequestedEmail failed:", e);
    }
    trackOutcome(userId, "PHASE17_ACCOUNT_DELETION_REQUESTED", {
      entityId: dataRequest.id,
      entityType: "DataRequest",
      metadata: { type: "DELETE" },
    }).catch(() => {});
  }

  try {
    const { actorIp, actorAgent } = getRequestContext(req);
    await logAudit({
      actorId: userId,
      actorRole: (session.user as { role?: string }).role ?? undefined,
      actorIp: actorIp ?? undefined,
      actorAgent: actorAgent ?? undefined,
      category: "COMPLIANCE",
      action: "DATA_REQUEST_CREATED",
      severity: "INFO",
      targetType: "DataRequest",
      targetId: dataRequest.id,
      metadata: { type, dataRequestId: dataRequest.id },
    });
  } catch {
    // non-blocking
  }

  return NextResponse.json({
    success: true,
    data: {
      id: dataRequest.id,
      type: dataRequest.type,
      status: dataRequest.status,
      requestedAt: dataRequest.requestedAt.toISOString(),
    },
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await prisma.dataRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { requestedAt: "desc" },
  });

  const data = requests.map((r) => ({
    id: r.id,
    type: r.type,
    status: r.status,
    requestedAt: r.requestedAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
    exportUrl: r.exportUrl ?? null,
  }));

  return NextResponse.json({ data });
}
