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
  if (!(await isEnabled("cover_letter_generator"))) {
    return NextResponse.json({ success: false, error: "Feature not available" }, { status: 503 });
  }

  const { jobId: jobIdParam } = await params;
  const jobId = parseJobId(jobIdParam);
  if (jobId == null) {
    return NextResponse.json({ success: false, error: "Invalid job id" }, { status: 400 });
  }

  const letter = await prisma.coverLetter.findUnique({
    where: {
      userId_jobPostId: { userId: session.user.id, jobPostId: jobId },
    },
    select: {
      id: true,
      content: true,
      tone: true,
      generatedFrom: true,
      createdAt: true,
    },
  });

  if (!letter) {
    return NextResponse.json({ coverLetter: null }, { status: 200 });
  }

  return NextResponse.json({
    coverLetter: {
      id: letter.id,
      content: letter.content,
      tone: letter.tone,
      generatedFrom: letter.generatedFrom,
      createdAt: letter.createdAt.toISOString(),
    },
  });
}
