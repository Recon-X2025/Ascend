/**
 * BL-24: Job syndication — create syndication record and tracking URL.
 * Actual board API integration requires per-board feasibility study.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { BASE_URL } from "@/lib/seo/metadata";

const BOARDS = ["NAUKRI", "LINKEDIN", "INDEED", "FOUNDIT", "GLASSDOOR", "MONSTER", "SHINE", "INTERNSHALA"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const jobPostId = parseInt(id, 10);
  if (isNaN(jobPostId)) return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const boards: string[] = Array.isArray(body.boards) ? body.boards : BOARDS.slice(0, 3);
  const job = await prisma.jobPost.findFirst({
    where: { id: jobPostId, status: "ACTIVE", recruiterId: session.user.id },
  });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  const results: { board: string; trackingUrl: string; status: string }[] = [];
  for (const board of boards) {
    if (!BOARDS.includes(board)) continue;
    const trackingUrl = `${BASE_URL}/jobs/apply/${job.slug}?utm_source=${board.toLowerCase()}`;
    await prisma.jobBoardSyndication.upsert({
      where: {
        jobPostId_board: { jobPostId, board },
      },
      create: {
        jobPostId,
        board,
        status: "PENDING",
        trackingUrl,
      },
      update: { trackingUrl },
    });
    results.push({ board, trackingUrl, status: "PENDING" });
  }
  return NextResponse.json({ success: true, data: results });
}
