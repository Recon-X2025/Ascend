import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { trackOutcome } from "@/lib/tracking/outcomes";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId().catch(() => null);
  const { id: courseId } = await params;

  const course = await prisma.courseRecommendation.findUnique({
    where: { id: courseId },
  });
  if (!course || !course.isActive) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.courseClick.create({
      data: {
        userId: userId ?? undefined,
        courseId,
        skill: course.skill,
      },
    }),
    prisma.courseRecommendation.update({
      where: { id: courseId },
      data: { clickCount: { increment: 1 } },
    }),
  ]);

  if (userId) {
    await trackOutcome(userId, "PHASE22_COURSE_CLICKED", {
      entityId: courseId,
      entityType: "CourseRecommendation",
      metadata: { skill: course.skill },
    });
  }

  const redirectUrl = course.affiliateCode
    ? `${course.url}${course.url.includes("?") ? "&" : "?"}ref=${encodeURIComponent(course.affiliateCode)}`
    : course.url;

  return NextResponse.json({ redirectUrl });
}
