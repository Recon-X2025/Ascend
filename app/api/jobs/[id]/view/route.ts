import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? null : n;
}

export async function POST(req: Request, { params }: Params) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id == null) return NextResponse.json({ success: false, error: "Invalid job id" }, { status: 400 });
  prisma.jobPost.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
  return NextResponse.json({ success: true });
}
