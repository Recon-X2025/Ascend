import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createNotification } from "@/lib/notifications/create";
import { NotificationType } from "@prisma/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const due = await prisma.mentorVerification.findMany({
    where: {
      status: "VERIFIED",
      nextReviewDue: { lte: now },
    },
    include: {
      mentorProfile: { include: { user: { select: { id: true } } } },
    },
  });

  let count = 0;
  for (const v of due) {
    await prisma.$transaction([
      prisma.mentorVerification.update({
        where: { id: v.id },
        data: { status: "REVERIFICATION_REQUIRED" },
      }),
      prisma.mentorProfile.update({
        where: { id: v.mentorProfileId },
        data: {
          verificationStatus: "REVERIFICATION_REQUIRED",
          isDiscoverable: false,
        },
      }),
    ]);
    await createNotification({
      userId: v.mentorProfile.user.id,
      type: NotificationType.MENTOR_REVERIFICATION_REQUIRED,
      title: "Re-verification required",
      body: "Your mentor verification has expired. Please re-submit to stay discoverable.",
      linkUrl: "/mentorship/verify",
    });
    count++;
  }

  return NextResponse.json({ processed: count });
}
