/**
 * M-7: Daily.co webhook handler.
 * Verify Daily-Signature. Handle meeting-started, participant-joined, participant-left, meeting-ended.
 * Async via BullMQ.
 */

import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { dailyCoWebhookQueue } from "@/lib/queues";

function verifyDailySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  try {
    const expected = createHmac("sha256", secret).update(payload).digest("base64");
    const sigBuf = Buffer.from(signature, "base64");
    const expBuf = Buffer.from(expected, "base64");
    return sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("Daily-Signature");
  const secret = process.env.DAILYCO_WEBHOOK_SECRET;

  if (secret && !verifyDailySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = typeof payload === "object" && payload && "type" in payload
    ? String((payload as { type: string }).type)
    : "unknown";

  const supported = ["meeting-started", "participant-joined", "participant-left", "meeting-ended"];
  if (!supported.includes(eventType)) {
    return NextResponse.json({ received: true });
  }

  dailyCoWebhookQueue.add("process", { payload: payload as object, eventType }).catch(() => {});

  return NextResponse.json({ received: true });
}
