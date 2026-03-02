import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { createEscrowOrder } from "@/lib/escrow";
import { z } from "zod";

const bodySchema = z.object({
  contractId: z.string().min(1),
  paymentMode: z.enum(["ESCROW", "FULL_UPFRONT"]).optional().default("ESCROW"),
});

/**
 * POST /api/mentorship/escrow/create
 * Mentee only. Creates escrow + Razorpay order for payment.
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

  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: body.contractId },
    select: { id: true, menteeUserId: true, status: true },
  });
  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }
  if (contract.menteeUserId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden — mentee only" }, { status: 403 });
  }

  try {
    const result = await createEscrowOrder(body.contractId, body.paymentMode as "ESCROW" | "FULL_UPFRONT");
    if ("error" in result) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 400 }
      );
    }
    return NextResponse.json({
      ...result,
      keyId: process.env.RAZORPAY_KEY_ID ?? undefined,
    });
  } catch (e) {
    console.error("[escrow/create] failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create escrow order" },
      { status: 400 }
    );
  }
}
