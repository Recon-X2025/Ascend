import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { voteSchema } from "@/lib/reviews/validate";

export async function POST(
  req: Request,
  context: { params: Promise<{ reviewId: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reviewId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const review = await prisma.companyReview.findUnique({
    where: { id: reviewId },
    select: { id: true, userId: true, helpfulCount: true, notHelpfulCount: true },
  });
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }
  if (review.userId === userId) {
    return NextResponse.json(
      { error: "You cannot vote on your own review." },
      { status: 400 }
    );
  }

  const existing = await prisma.companyReviewVote.findUnique({
    where: { reviewId_userId: { reviewId, userId } },
  });

  const helpful = parsed.data.helpful;
  let deltaHelpful = 0;
  let deltaUnhelpful = 0;
  if (!existing) {
    if (helpful) deltaHelpful = 1;
    else deltaUnhelpful = 1;
  } else {
    if (existing.helpful && !helpful) {
      deltaHelpful = -1;
      deltaUnhelpful = 1;
    } else if (!existing.helpful && helpful) {
      deltaHelpful = 1;
      deltaUnhelpful = -1;
    }
  }

  await prisma.$transaction([
    prisma.companyReviewVote.upsert({
      where: { reviewId_userId: { reviewId, userId } },
      create: { reviewId, userId, helpful },
      update: { helpful },
    }),
    prisma.companyReview.update({
      where: { id: reviewId },
      data: {
        ...(deltaHelpful !== 0 && { helpfulCount: { increment: deltaHelpful } }),
        ...(deltaUnhelpful !== 0 && { notHelpfulCount: { increment: deltaUnhelpful } }),
      },
    }),
  ]);

  const updated = await prisma.companyReview.findUnique({
    where: { id: reviewId },
    select: { helpfulCount: true, notHelpfulCount: true },
  });

  return NextResponse.json({
    success: true,
    helpfulCount: updated?.helpfulCount ?? review.helpfulCount,
    unhelpfulCount: updated?.notHelpfulCount ?? review.notHelpfulCount,
  });
}
