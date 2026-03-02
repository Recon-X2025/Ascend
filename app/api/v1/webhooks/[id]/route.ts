import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api/middleware";
import { prisma } from "@/lib/prisma/client";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiAuth(request, "webhooks:write", async (_req, { apiKey }) => {
    const { id } = await params;

    const webhook = await prisma.companyWebhook.findFirst({
      where: { id, companyId: apiKey.companyId },
    });

    if (!webhook) {
      return NextResponse.json({ success: false, error: "Webhook not found" }, { status: 404 });
    }

    await prisma.companyWebhook.delete({ where: { id } });
    return NextResponse.json({ success: true });
  });
}
