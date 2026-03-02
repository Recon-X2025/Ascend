import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { isCompanyOwnerOrAdmin } from "@/lib/companies/permissions";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "FLAGGED"]),
  flagReason: z.string().max(1000).optional(),
});

export async function PATCH(
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

  const allowed = await isCompanyOwnerOrAdmin(userId, company.id);
  if (!allowed) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "status must be APPROVED, REJECTED, or FLAGGED" }, { status: 400 });
  }

  const review = await prisma.companyReview.findFirst({
    where: { id: reviewId, companyId: company.id },
  });
  if (!review) return NextResponse.json({ success: false, error: "Review not found" }, { status: 404 });

  const data: { status: "APPROVED" | "REJECTED" | "FLAGGED"; flagReason?: string | null } = {
    status: parsed.data.status,
  };
  if (parsed.data.status === "FLAGGED" && parsed.data.flagReason != null) {
    data.flagReason = parsed.data.flagReason;
  } else if (parsed.data.status !== "FLAGGED") {
    data.flagReason = null;
  }

  await prisma.companyReview.update({
    where: { id: reviewId },
    data,
  });

  return NextResponse.json({ status: parsed.data.status });
}
