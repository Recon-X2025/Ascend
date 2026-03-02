import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? null : n;
}

export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { id: idParam } = await params;
  const jobId = parseId(idParam);
  if (jobId == null) return NextResponse.json({ success: false, error: "Invalid job id" }, { status: 400 });

  const job = await prisma.jobPost.findUnique({ where: { id: jobId }, select: { id: true } });
  if (!job) return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });

  const prev = await prisma.savedJob.findUnique({
    where: { userId_jobPostId: { userId: session.user.id, jobPostId: jobId } },
  });
  if (prev) {
    await prisma.savedJob.delete({ where: { id: prev.id } });
    return NextResponse.json({ success: true, saved: false });
  }
  await prisma.savedJob.create({ data: { userId: session.user.id, jobPostId: jobId } });
  return NextResponse.json({ success: true, saved: true });
}
