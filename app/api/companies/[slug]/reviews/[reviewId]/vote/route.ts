import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; reviewId: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, reviewId } = await params;
  const company = await prisma.company.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const review = await prisma.companyReview.findFirst({
    where: { id: reviewId, companyId: company.id },
    select: { id: true },
  });
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const helpful = typeof body.helpful === "boolean" ? body.helpful : undefined;
  if (helpful === undefined) {
    return NextResponse.json({ error: "helpful (boolean) required" }, { status: 400 });
  }

  await prisma.companyReviewVote.upsert({
    where: { reviewId_userId: { reviewId, userId } },
    create: { reviewId, userId, helpful },
    update: { helpful },
  });

  const counts = await prisma.companyReviewVote.groupBy({
    by: ["helpful"],
    where: { reviewId },
    _count: true,
  });
  const helpfulCount = counts.find((c) => c.helpful === true)?._count ?? 0;
  const notHelpfulCount = counts.find((c) => c.helpful === false)?._count ?? 0;
  await prisma.companyReview.update({
    where: { id: reviewId },
    data: { helpfulCount, notHelpfulCount },
  });

  return NextResponse.json({ helpfulCount, notHelpfulCount });
}
