import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireRecruiterSession, assertApplicationAccess } from "@/lib/recruiter-intelligence/auth";

export async function GET(req: Request) {
  const auth = await requireRecruiterSession();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const applicationId = url.searchParams.get("applicationId");
  if (!applicationId) {
    return NextResponse.json({ error: "applicationId is required" }, { status: 400 });
  }
  const hasAccess = await assertApplicationAccess(auth.userId, applicationId);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      applicantId: true,
      jobPostId: true,
      applicant: { select: { name: true } },
    },
  });
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const fitScore = await prisma.fitScore.findUnique({
    where: {
      userId_jobPostId: { userId: application.applicantId, jobPostId: application.jobPostId },
    },
  });
  if (!fitScore) {
    return NextResponse.json(
      { error: "Fit score not available for this application" },
      { status: 404 }
    );
  }

  const s = fitScore.skillsScore ?? 0;
  const e = fitScore.experienceScore ?? 0;
  const edu = fitScore.educationScore ?? 0;
  const k = fitScore.keywordsScore ?? 0;
  const breakdown = {
    skillsMatch: {
      score: Math.round((s / 100) * 30),
      max: 30,
      label: "Skills match",
    },
    experienceMatch: {
      score: Math.round((e / 100) * 25),
      max: 25,
      label: "Experience match",
    },
    educationMatch: {
      score: Math.round((edu / 100) * 10),
      max: 10,
      label: "Education match",
    },
    locationMatch: { score: 0, max: 10, label: "Location match" },
    keywordMatch: {
      score: Math.round((k / 100) * 15),
      max: 15,
      label: "Keyword match",
    },
    profileCompleteness: { score: 10, max: 10, label: "Profile completeness" },
  };

  const strengths = (fitScore.strengths as string[]) ?? [];
  const skillGaps = (fitScore.skillGaps as { item: string }[]) ?? [];
  const expGaps = (fitScore.experienceGaps as { item: string }[]) ?? [];
  const keywordGaps = (fitScore.keywordGaps as { item: string }[]) ?? [];
  const topStrengths = strengths.slice(0, 3);
  const topGaps = [
    ...skillGaps.map((g) => g.item),
    ...expGaps.map((g) => g.item),
    ...keywordGaps.map((g) => g.item),
  ].slice(0, 3);

  return NextResponse.json({
    applicationId: application.id,
    candidateName: application.applicant.name ?? "Candidate",
    overallScore: fitScore.overallScore,
    breakdown,
    topStrengths,
    topGaps,
  });
}
