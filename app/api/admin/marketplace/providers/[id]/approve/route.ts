import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { logAdminAction } from "@/lib/admin/audit";
import { createNotification } from "@/lib/notifications/create";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { NotificationType } from "@prisma/client";

export async function POST(
  _req: Request,
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

  const now = new Date();
  await prisma.marketplaceProvider.update({
    where: { id: providerId },
    data: { status: "ACTIVE", approvedAt: now, adminNote: null },
  });

  await logAdminAction({
    adminId: session.user.id,
    action: "MARKETPLACE_PROVIDER_APPROVED",
    targetType: "MarketplaceProvider",
    targetId: providerId,
    targetLabel: provider.userId,
  });

  await createNotification({
    userId: provider.userId,
    type: NotificationType.MARKETPLACE_PROVIDER_APPROVED,
    title: "You're approved as a marketplace provider",
    body: "Your profile is now live. You can receive orders from the dashboard.",
    linkUrl: "/dashboard/provider",
  });

  await trackOutcome(provider.userId, "PHASE22_PROVIDER_APPROVED", {
    entityId: providerId,
    entityType: "MarketplaceProvider",
    metadata: { providerType: provider.type },
  });

  try {
    const { sendProviderApprovedEmail } = await import("@/lib/email/marketplace");
    if (provider.user?.email) await sendProviderApprovedEmail(provider.user.email);
  } catch {
    // Resend not configured
  }

  return NextResponse.json({ success: true, status: "ACTIVE" });
}
