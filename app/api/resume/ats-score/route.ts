import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { getFullATSResult, type ContentSnapshotForATS, type ATSComplianceResult } from "@/lib/resume/ats-compliance";
import { analyzeKeywords, getKeywordScoreFromAnalysis, type KeywordAnalysis } from "@/lib/resume/keyword-optimizer";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDateRange(
  startMonth: number,
  startYear: number,
  endMonth: number | null,
  endYear: number | null,
  isCurrent: boolean
): string {
  const start = `${MONTH_NAMES[Math.max(0, startMonth - 1)]} ${startYear}`;
  if (isCurrent || !endYear) return `${start} – Present`;
  const end = endMonth
    ? `${MONTH_NAMES[Math.max(0, endMonth - 1)]} ${endYear}`
    : `${endYear}`;
  return `${start} – ${end}`;
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { contentSnapshot, careerIntentId } = body as {
    contentSnapshot?: ContentSnapshotForATS;
    careerIntentId?: string;
  };

  if (!contentSnapshot || typeof contentSnapshot !== "object") {
    return NextResponse.json(
      { success: false, error: "contentSnapshot is required" },
      { status: 400 }
    );
  }
  if (!careerIntentId) {
    return NextResponse.json(
      { success: false, error: "careerIntentId is required" },
      { status: 400 }
    );
  }

  const intent = await prisma.careerIntent.findUnique({
    where: { id: careerIntentId },
    include: {
      profile: {
        include: {
          user: { select: { name: true, email: true } },
          experiences: { orderBy: [{ isCurrent: "desc" }, { endYear: "desc" }] },
          educations: { orderBy: { endYear: "desc" } },
        },
      },
    },
  });

  if (!intent || intent.userId !== userId) {
    return NextResponse.json({ success: false, error: "Career intent not found" }, { status: 404 });
  }

  const profile = intent.profile;
  const user = profile?.user;
  const contact = user
    ? {
        name: user.name ?? null,
        email: user.email ?? null,
        phone: null as string | null,
        location: [profile.city, profile.state, profile.country].filter(Boolean).join(", ") || null,
      }
    : undefined;

  const dateStrings: string[] = [];
  for (const e of profile?.experiences ?? []) {
    dateStrings.push(
      formatDateRange(
        e.startMonth,
        e.startYear,
        e.endMonth,
        e.endYear,
        e.isCurrent
      )
    );
  }
  for (const ed of profile?.educations ?? []) {
    const startYear = ed.startYear ?? ed.endYear;
    const endYear = ed.endYear ?? (ed.isCurrent ? null : new Date().getFullYear());
    if (startYear) {
      dateStrings.push(
        ed.isCurrent
          ? `January ${startYear} – Present`
          : `January ${startYear} – December ${endYear ?? startYear}`
      );
    }
  }

  const keywordAnalysis: KeywordAnalysis = analyzeKeywords(contentSnapshot, intent.targetRole);
  const keywordScore = getKeywordScoreFromAnalysis(keywordAnalysis);

  const result: ATSComplianceResult = getFullATSResult(
    contentSnapshot,
    { contact, dateStrings, templateFont: null },
    keywordScore
  );

  const snapshotWithKeywords = {
    ...contentSnapshot,
    keywordAnalysis,
  };

  const resumeVersion = await prisma.resumeVersion.findFirst({
    where: { careerIntentId },
    orderBy: { updatedAt: "desc" },
  });

  if (resumeVersion) {
    await prisma.resumeVersion.update({
      where: { id: resumeVersion.id },
      data: {
        atsScore: result.score,
        contentSnapshot: snapshotWithKeywords as object,
        lastUpdatedAt: new Date(),
      },
    });
  } else {
    await prisma.resumeVersion.create({
      data: {
        userId: intent.userId,
        careerIntentId,
        name: intent.targetRole ? `Draft — ${intent.targetRole}` : "Draft",
        contentSnapshot: snapshotWithKeywords as object,
        atsScore: result.score,
        lastUpdatedAt: new Date(),
      },
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      ...result,
      keywordAnalysis,
    },
  });
}
