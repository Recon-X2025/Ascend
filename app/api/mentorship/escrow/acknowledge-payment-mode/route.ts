import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const bodySchema = z.object({
  escrowId: z.string().min(1),
  paymentMode: z.enum(["ESCROW", "FULL_UPFRONT"]),
  waiverText: z.string().min(1),
});

/**
 * POST /api/mentorship/escrow/acknowledge-payment-mode
 * Mentee only. Records waiver acknowledgement for FULL_UPFRONT before Razorpay checkout.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid body", details: e }, { status: 400 });
  }

  if (body.paymentMode !== "FULL_UPFRONT") {
    return NextResponse.json({ error: "Acknowledgement required only for FULL_UPFRONT" }, { status: 400 });
  }

  const escrow = await prisma.mentorshipEscrow.findUnique({
    where: { id: body.escrowId },
    select: { id: true, menteeId: true, status: true, paymentMode: true },
  });
  if (!escrow) {
    return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
  }
  if (escrow.menteeId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden — mentee only" }, { status: 403 });
  }
  if (escrow.status !== "PENDING_PAYMENT") {
    return NextResponse.json({ error: "Escrow not in PENDING_PAYMENT" }, { status: 400 });
  }
  if (escrow.paymentMode !== "FULL_UPFRONT") {
    return NextResponse.json({ error: "Escrow is not FULL_UPFRONT" }, { status: 400 });
  }

  const existing = await prisma.paymentModeAcknowledgement.findUnique({
    where: { escrowId: body.escrowId },
  });
  if (existing) {
    return NextResponse.json({ acknowledged: true });
  }

  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? null;

  await prisma.paymentModeAcknowledgement.create({
    data: {
      escrowId: body.escrowId,
      menteeId: session.user.id,
      paymentMode: "FULL_UPFRONT",
      waiverText: body.waiverText,
      ipAddress,
    },
  });

  return NextResponse.json({ acknowledged: true });
}
