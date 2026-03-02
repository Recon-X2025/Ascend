import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

const MAX_HISTORY = 20;
const RETURN_LIMIT = 10;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const list = await prisma.searchHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { searchedAt: "desc" },
    take: RETURN_LIMIT,
    select: { id: true, query: true, filters: true, searchedAt: true },
  });
  return NextResponse.json({
    success: true,
    data: list.map((h) => ({ query: h.query, filters: h.filters, summary: formatSummary(h.filters) })),
  });
}

function formatSummary(filters: unknown): string {
  if (!filters || typeof filters !== "object") return "";
  const o = filters as Record<string, unknown>;
  const parts: string[] = [];
  if (Array.isArray(o.skills) && o.skills.length) parts.push((o.skills as string[]).slice(0, 2).join(", "));
  if (Array.isArray(o.workMode) && o.workMode.length) parts.push((o.workMode as string[]).join(", "));
  if (Array.isArray(o.jobType) && o.jobType.length) parts.push((o.jobType as string[]).join(", "));
  return parts.join(" · ");
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) return NextResponse.json({ success: false, error: "query required" }, { status: 400 });
  const filters = body.filters ?? null;
  await prisma.searchHistory.create({
    data: { userId: session.user.id, query, filters },
  });
  const count = await prisma.searchHistory.count({ where: { userId: session.user.id } });
  if (count > MAX_HISTORY) {
    const oldest = await prisma.searchHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { searchedAt: "asc" },
      take: count - MAX_HISTORY,
      select: { id: true },
    });
    if (oldest.length) {
      await prisma.searchHistory.deleteMany({
        where: { id: { in: oldest.map((o) => o.id) } },
      });
    }
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");
  if (query !== null) {
    await prisma.searchHistory.deleteMany({
      where: { userId: session.user.id, query },
    });
  } else {
    await prisma.searchHistory.deleteMany({
      where: { userId: session.user.id },
    });
  }
  return NextResponse.json({ success: true });
}
