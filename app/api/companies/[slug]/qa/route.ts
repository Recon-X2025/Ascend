import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const postQuestionSchema = z.object({ question: z.string().min(10).max(5000) });

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
  if (!company) return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
  const sort = searchParams.get("sort") ?? "upvotes";
  const [items, totalCount] = await Promise.all([
    prisma.companyQA.findMany({
      where: { companyId: company.id },
      orderBy: sort === "recent" ? { createdAt: "desc" } : [{ upvotes: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        question: true,
        answer: true,
        answeredBy: true,
        answeredAt: true,
        upvotes: true,
        downvotes: true,
        createdAt: true,
      },
    }),
    prisma.companyQA.count({ where: { companyId: company.id } }),
  ]);
  const answererIds = Array.from(new Set(items.map((q) => q.answeredBy).filter(Boolean))) as string[];
  const answerers = answererIds.length
    ? await prisma.user.findMany({
        where: { id: { in: answererIds } },
        select: { id: true, name: true },
      })
    : [];
  const answererMap = Object.fromEntries(answerers.map((u) => [u.id, u.name ?? "User"]));
  const list = items.map((q) => ({
    id: q.id,
    question: q.question,
    answer: q.answer,
    answeredBy: q.answeredBy ? answererMap[q.answeredBy] ?? "Company" : null,
    answeredAt: q.answeredAt,
    upvotes: q.upvotes,
    downvotes: q.downvotes,
    createdAt: q.createdAt,
  }));
  return NextResponse.json({ questions: list, totalCount });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { slug } = await params;
  const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
  if (!company) return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
  const { allowed, resetIn } = await checkRateLimit(`qa:${userId}`, 10, 3600);
  if (!allowed) {
    return NextResponse.json({ success: false, error: "Too many submissions. Please try again later.", resetIn }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = postQuestionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: "question required (min 10 chars)" }, { status: 400 });
  const qa = await prisma.companyQA.create({
    data: { companyId: company.id, userId, question: parsed.data.question },
  });
  return NextResponse.json({ id: qa.id, question: qa.question, createdAt: qa.createdAt });
}
