import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { getSignedDownloadUrlWithExpiry } from "@/lib/storage";
import { logAudit } from "@/lib/audit/log";
import { trackOutcome } from "@/lib/tracking/outcomes";

const DOWNLOAD_URL_TTL = 300; // 5 min

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!invoice) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (invoice.status !== "FINALISED" || !invoice.pdfS3Key) {
    return NextResponse.json({ success: false, error: "PDF not yet available" }, { status: 404 });
  }

  const signedUrl = await getSignedDownloadUrlWithExpiry(invoice.pdfS3Key, DOWNLOAD_URL_TTL);

  await logAudit({
    actorId: session.user.id,
    category: "PAYMENT",
    action: "INVOICE_DOWNLOADED",
    targetType: "Invoice",
    targetId: id,
    metadata: { invoiceNumber: invoice.invoiceNumber },
  });

  trackOutcome(session.user.id, "INVOICE_DOWNLOADED", {
    entityId: id,
    entityType: "Invoice",
  }).catch(() => {});

  return NextResponse.json({ url: signedUrl });
}
