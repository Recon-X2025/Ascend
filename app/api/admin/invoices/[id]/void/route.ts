import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { voidInvoice } from "@/lib/invoice/generate";
import { logAudit } from "@/lib/audit/log";
import { sendInvoiceVoid } from "@/lib/email/templates/invoice/invoice-void";
import { z } from "zod";

const bodySchema = z.object({ reason: z.string().min(1).max(500) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 });

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });
  if (!invoice) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (invoice.status === "VOID") return NextResponse.json({ success: false, error: "Already voided" }, { status: 400 });

  await voidInvoice(id, parsed.data.reason);

  if (invoice.user?.email) {
    await sendInvoiceVoid({
      to: invoice.user.email,
      invoiceNumber: invoice.invoiceNumber,
      reason: parsed.data.reason,
    });
  }

  await logAudit({
    actorId: session.user.id,
    actorRole: "PLATFORM_ADMIN",
    category: "ADMIN_ACTION",
    action: "INVOICE_VOIDED",
    targetType: "Invoice",
    targetId: id,
    metadata: { invoiceNumber: invoice.invoiceNumber, reason: parsed.data.reason },
    severity: "WARNING",
  });

  const systemUserId = process.env.M16_SYSTEM_ACTOR_ID;
  if (systemUserId) {
    const { trackOutcome } = await import("@/lib/tracking/outcomes");
    await trackOutcome(systemUserId, "INVOICE_VOIDED", {
      entityId: id,
      entityType: "Invoice",
      metadata: { reason: parsed.data.reason },
    }).catch(() => {});
  }

  return NextResponse.json({ voided: true });
}
