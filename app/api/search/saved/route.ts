import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

const MAX_SAVED_FREE = 10;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const list = await prisma.savedSearch.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, query: true, filters: true, createdAt: true },
  });
  return NextResponse.json({ success: true, data: list });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!name && !query) return NextResponse.json({ success: false, error: "name or query required" }, { status: 400 });
  const count = await prisma.savedSearch.count({ where: { userId: session.user.id } });
  if (count >= MAX_SAVED_FREE) {
    return NextResponse.json({ success: false, error: "Maximum saved searches (10) reached" }, { status: 400 });
  }
  const filters = body.filters ?? null;
  const saved = await prisma.savedSearch.create({
    data: {
      userId: session.user.id,
      name: name || query || "My search",
      query: query || name,
      filters,
    },
  });
  return NextResponse.json({ success: true, data: saved });
}
