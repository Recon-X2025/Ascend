import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { isEnabled } from "@/lib/feature-flags";

type Params = { params: Promise<{ jobId: string }> };

function parseJobId(jobId: string): number | null {
  const n = parseInt(jobId, 10);
  return Number.isNaN(n) ? null : n;
}

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isEnabled("interview_prep"))) {
    return NextResponse.json({ success: false, error: "Feature not available" }, { status: 503 });
  }

  const { jobId: jobIdParam } = await params;
  const jobId = parseJobId(jobIdParam);
  if (jobId == null) {
    return NextResponse.json({ success: false, error: "Invalid job id" }, { status: 400 });
  }

  const prep = await prisma.interviewPrep.findUnique({
    where: {
      userId_jobPostId: { userId: session.user.id, jobPostId: jobId },
    },
    select: {
      id: true,
      expectQuestions: true,
      askQuestions: true,
      createdAt: true,
    },
  });

  if (!prep) {
    return NextResponse.json({ interviewPrep: null }, { status: 200 });
  }

  return NextResponse.json({
    interviewPrep: {
      id: prep.id,
      expectQuestions: prep.expectQuestions as Array<{ question: string; category: string; why: string }>,
      askQuestions: (prep.askQuestions as Array<{ question: string }>) ?? [],
      createdAt: prep.createdAt.toISOString(),
    },
  });
}
