import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { getProfileOrNull } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { resumeQueue } from "@/lib/queues";
import { RESUME_JOB_GENERATE_CONTENT } from "@/lib/queues";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const profile = await getProfileOrNull(userId);
  if (!profile) {
    return NextResponse.json({ success: false, error: "Job seeker profile required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    careerIntentId,
    selectedItems,
    condenseExperienceIds,
    regenerateExperienceId,
    regenerationCount,
  } = body as {
    careerIntentId?: string;
    selectedItems?: { experiences?: string[]; skills?: string[]; education?: string[]; certs?: string[]; projects?: string[] };
    condenseExperienceIds?: string[];
    regenerateExperienceId?: string;
    regenerationCount?: number;
  };

  if (!careerIntentId || !selectedItems) {
    return NextResponse.json(
      { success: false, error: "careerIntentId and selectedItems are required" },
      { status: 400 }
    );
  }

  const intent = await prisma.careerIntent.findUnique({
    where: { id: careerIntentId },
    select: { id: true, userId: true, profileId: true },
  });
  if (!intent || intent.userId !== userId) {
    return NextResponse.json({ success: false, error: "Career intent not found" }, { status: 404 });
  }

  const payload = {
    jobType: RESUME_JOB_GENERATE_CONTENT,
    userId,
    careerIntentId,
    selectedItems: {
      experiences: Array.isArray(selectedItems.experiences) ? selectedItems.experiences : [],
      skills: Array.isArray(selectedItems.skills) ? selectedItems.skills : [],
      education: Array.isArray(selectedItems.education) ? selectedItems.education : [],
      certs: Array.isArray(selectedItems.certs) ? selectedItems.certs : [],
      projects: Array.isArray(selectedItems.projects) ? selectedItems.projects : [],
    },
    condenseExperienceIds: Array.isArray(condenseExperienceIds) ? condenseExperienceIds : undefined,
    regenerateExperienceId: typeof regenerateExperienceId === "string" ? regenerateExperienceId : undefined,
    regenerationCount: typeof regenerationCount === "number" ? regenerationCount : undefined,
  };

  const job = await resumeQueue.add("generate-content", payload);
  return NextResponse.json({ success: true, data: { jobId: job.id } }, { status: 202 });
}
