import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { trackOutcome } from "@/lib/tracking/outcomes";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const id = (await params).id;
  const app = await prisma.jobApplication.findUnique({
    where: { id },
    select: { id: true, applicantId: true, jobPostId: true, status: true, submittedAt: true },
  });

  if (!app) {
    return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
  }
  if (app.applicantId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  if (app.status === "WITHDRAWN" || app.status === "REJECTED") {
    return NextResponse.json(
      { error: "Application cannot be withdrawn" },
      { status: 400 }
    );
  }

  const job = await prisma.jobPost.findUnique({
    where: { id: app.jobPostId },
    select: { applicationCount: true },
  });
  const newCount = Math.max(0, (job?.applicationCount ?? 1) - 1);

  await prisma.$transaction([
    prisma.jobApplication.update({
      where: { id },
      data: { status: "WITHDRAWN", statusUpdatedAt: new Date() },
    }),
    prisma.jobPost.update({
      where: { id: app.jobPostId },
      data: { applicationCount: newCount },
    }),
  ]);

  const daysAfterSubmit = Math.floor(
    (Date.now() - app.submittedAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  trackOutcome(session.user.id, "APPLICATION_WITHDRAWN", {
    entityId: app.id,
    entityType: "JobApplication",
    metadata: {
      jobPostId: app.jobPostId,
      applicationId: app.id,
      daysAfterSubmit,
    },
  });

  return NextResponse.json({ status: "WITHDRAWN" });
}
