import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await context.params;

  const optSession = await prisma.optimisationSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      jobPost: { select: { slug: true } },
      outputVersion: {
        select: {
          id: true,
          name: true,
          optimisationMeta: true,
          createdAt: true,
        },
      },
    },
  });

  if (!optSession) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    sessionId: optSession.id,
    status: optSession.status,
    fitScoreBefore: optSession.fitScoreBefore,
    fitScoreAfter: optSession.fitScoreAfter,
    gapAnalysis: optSession.gapAnalysis,
    errorMessage: optSession.errorMessage,
    outputVersion: optSession.outputVersion ?? null,
    jobSlug: optSession.jobPost?.slug ?? null,
  });
}
