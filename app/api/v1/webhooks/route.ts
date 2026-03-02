import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { withApiAuth } from "@/lib/api/middleware";
import { prisma } from "@/lib/prisma/client";

const WEBHOOK_EVENTS = [
  "application.created",
  "application.status_changed",
  "job.created",
  "job.closed",
] as const;

const createBodySchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1).max(10),
});

export async function GET(request: Request) {
  return withApiAuth(request, "webhooks:write", async (_req, { apiKey }) => {
    const webhooks = await prisma.companyWebhook.findMany({
      where: { companyId: apiKey.companyId },
      select: { id: true, url: true, events: true, isActive: true, createdAt: true },
    });
    return NextResponse.json({ data: webhooks });
  });
}

export async function POST(request: Request) {
  return withApiAuth(request, "webhooks:write", async (req, { apiKey }) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = createBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const secret = randomBytes(32).toString("hex");
    const webhook = await prisma.companyWebhook.create({
      data: {
        companyId: apiKey.companyId,
        url: parsed.data.url,
        secret,
        events: parsed.data.events,
      },
    });

    return NextResponse.json({
      data: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        isActive: webhook.isActive,
        secret, // shown once
        createdAt: webhook.createdAt,
      },
    });
  });
}
