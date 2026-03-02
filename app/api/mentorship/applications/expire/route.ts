import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { sendApplicationExpiredToMentee } from "@/lib/email/templates/mentorship/application-expired";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const toExpire = await prisma.mentorApplication.findMany({
    where: {
      status: { in: ["PENDING", "QUESTION_ASKED"] },
      expiresAt: { lt: now },
    },
    include: {
      mentorProfile: { include: { user: { select: { name: true } } } },
      mentee: { select: { email: true, name: true } },
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "";

  for (const app of toExpire) {
    await prisma.mentorApplication.update({
      where: { id: app.id },
      data: { status: "EXPIRED", updatedAt: now },
    });
    if (app.mentee.email) {
      await sendApplicationExpiredToMentee({
        to: app.mentee.email,
        mentorName: app.mentorProfile.user.name ?? "The mentor",
        mentorshipUrl: `${baseUrl}/mentorship`,
      });
    }
  }

  return NextResponse.json({
    expired: toExpire.length,
    ids: toExpire.map((a) => a.id),
  });
}
