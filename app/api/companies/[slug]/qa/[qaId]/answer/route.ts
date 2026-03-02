import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { isCompanyOwnerOrAdmin } from "@/lib/companies/permissions";
import { z } from "zod";

const answerSchema = z.object({ answer: z.string().min(10).max(10000) });

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

  const allowed = await isCompanyOwnerOrAdmin(userId, company.id);
  if (!allowed) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = answerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "answer required (min 10 chars)" }, { status: 400 });
  }

  const qa = await prisma.companyQA.findFirst({
    where: { id: qaId, companyId: company.id },
  });
  if (!qa) return NextResponse.json({ success: false, error: "Question not found" }, { status: 404 });

  await prisma.companyQA.update({
    where: { id: qaId },
    data: {
      answer: parsed.data.answer,
      answeredBy: userId,
      answeredAt: new Date(),
    },
  });
  return NextResponse.json({ message: "Answer submitted." });
}
