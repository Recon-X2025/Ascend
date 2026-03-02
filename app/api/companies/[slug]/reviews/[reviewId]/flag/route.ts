import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const flagSchema = z.object({ reason: z.string().min(1).max(1000) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; reviewId: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { slug, reviewId } = await params;
  const company = await prisma.company.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!company) return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = flagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "reason required (1-1000 chars)" }, { status: 400 });
  }

  const review = await prisma.companyReview.findFirst({
    where: { id: reviewId, companyId: company.id },
  });
  if (!review) return NextResponse.json({ success: false, error: "Review not found" }, { status: 404 });

  await prisma.companyReview.update({
    where: { id: reviewId },
    data: { status: "FLAGGED", flagReason: parsed.data.reason },
  });

  return NextResponse.json({
    message: "Review has been flagged for moderation.",
  });
}
