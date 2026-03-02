import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { logAdminAction } from "@/lib/admin/audit";
import { createNotification } from "@/lib/notifications/create";
import { NotificationType } from "@prisma/client";
import { z } from "zod";

const bodySchema = z.object({ reason: z.string().max(1000).optional() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: providerId } = await params;
  const provider = await prisma.marketplaceProvider.findUnique({
    where: { id: providerId },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  if (provider.status !== "PENDING_REVIEW") {
    return NextResponse.json({ error: "Provider is not pending review" }, { status: 400 });
  }

  let reason: string | undefined;
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (parsed.success) reason = parsed.data.reason;
  } catch {
    // no body
  }

  await prisma.marketplaceProvider.update({
    where: { id: providerId },
    data: { status: "SUSPENDED", suspendedAt: new Date(), adminNote: reason ?? "Rejected" },
  });

  await logAdminAction({
    adminId: session.user.id,
    action: "MARKETPLACE_PROVIDER_REJECTED",
    targetType: "MarketplaceProvider",
    targetId: providerId,
    targetLabel: provider.userId,
    metadata: { reason },
  });

  await createNotification({
    userId: provider.userId,
    type: NotificationType.MARKETPLACE_PROVIDER_REJECTED,
    title: "Marketplace provider application update",
    body: reason ?? "We couldn't approve your provider profile at this time. You may reapply with additional information.",
    linkUrl: "/marketplace/become-provider",
  });

  try {
    const { sendProviderRejectedEmail } = await import("@/lib/email/marketplace");
    if (provider.user?.email) await sendProviderRejectedEmail(provider.user.email, reason);
  } catch {
    // Resend not configured
  }

  return NextResponse.json({ success: true, status: "SUSPENDED" });
}
