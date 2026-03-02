import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { resumeQueue } from "@/lib/queues";
import { RESUME_JOB_GENERATE_SUMMARY } from "@/lib/queues";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { careerIntentId } = body as { careerIntentId?: string };

  if (!careerIntentId) {
    return NextResponse.json(
      { success: false, error: "careerIntentId is required" },
      { status: 400 }
    );
  }

  const intent = await prisma.careerIntent.findUnique({
    where: { id: careerIntentId },
    select: { id: true, userId: true },
  });
  if (!intent || intent.userId !== userId) {
    return NextResponse.json({ success: false, error: "Career intent not found" }, { status: 404 });
  }

  const payload = {
    jobType: RESUME_JOB_GENERATE_SUMMARY,
    userId,
    careerIntentId,
  };

  const job = await resumeQueue.add("generate-summary", payload);
  return NextResponse.json({ success: true, data: { jobId: job.id } }, { status: 202 });
}
