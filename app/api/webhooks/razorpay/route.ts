import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma/client";
import { PaymentGateway, PaymentStatus } from "@prisma/client";

export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ success: false, error: "Not configured" }, { status: 500 });
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  const body = await req.text();
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  if (expected !== sig) return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });

  const data = JSON.parse(body) as { event: string; payload?: { payment?: { entity?: { id: string; order_id?: string; amount: number; status: string } }; subscription?: { entity?: { id: string } } } };
  const ev = data.event;
  const payload = data.payload;

  if (ev === "payment.captured" && payload?.payment?.entity) {
    const e = payload.payment.entity;
    const ok = await prisma.paymentEvent.findUnique({ where: { gatewayEventId: e.id } });
    if (!ok) {
      await prisma.paymentEvent.create({
        data: {
          gateway: PaymentGateway.RAZORPAY,
          gatewayEventId: e.id,
          gatewayOrderId: e.order_id ?? null,
          amount: e.amount,
          currency: "INR",
          status: e.status === "captured" ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
          description: "Payment",
        },
      });
    }
  }

  if ((ev === "subscription.activated" || ev === "subscription.cancelled") && payload?.subscription?.entity) {
    const sid = payload.subscription.entity.id;
    const status = ev === "subscription.activated" ? "ACTIVE" : "CANCELLED";
    await prisma.userSubscription.updateMany({ where: { gatewaySubId: sid }, data: { status: status as "ACTIVE" | "CANCELLED" } });
    await prisma.companySubscription.updateMany({ where: { gatewaySubId: sid }, data: { status: status as "ACTIVE" | "CANCELLED" } });
  }

  return NextResponse.json({ received: true });
}
