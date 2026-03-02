import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";
import type { CompanyQAVoteType } from "@prisma/client";

const voteSchema = z.object({ upvote: z.boolean() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; qaId: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { slug, qaId } = await params;
  const company = await prisma.company.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!company) return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });

  const qa = await prisma.companyQA.findFirst({
    where: { id: qaId, companyId: company.id },
    select: { id: true, upvotes: true, downvotes: true },
  });
  if (!qa) return NextResponse.json({ success: false, error: "Question not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "upvote (boolean) required" }, { status: 400 });
  }

  const vote: CompanyQAVoteType = parsed.data.upvote ? "UP" : "DOWN";
  await prisma.companyQAVote.upsert({
    where: { qaId_userId: { qaId, userId } },
    create: { qaId, userId, vote },
    update: { vote },
  });

  const counts = await prisma.companyQAVote.groupBy({
    by: ["vote"],
    where: { qaId },
    _count: true,
  });
  const upvotes = counts.find((c) => c.vote === "UP")?._count ?? 0;
  const downvotes = counts.find((c) => c.vote === "DOWN")?._count ?? 0;
  await prisma.companyQA.update({
    where: { id: qaId },
    data: { upvotes, downvotes },
  });

  return NextResponse.json({ upvotes, downvotes });
}
