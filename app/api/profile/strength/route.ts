/**
 * BL-6: Profile strength gamification — completion with milestones and next-step nudges.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { profileInclude } from "@/lib/profile/queries";
import { calculateCompletionScore } from "@/lib/profile/completion";
import type { FullProfile } from "@/lib/profile/completion";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const [profile, careerContext] = await Promise.all([
    prisma.jobSeekerProfile.findUnique({
      where: { userId },
      include: profileInclude,
    }),
    prisma.userCareerContext.findUnique({
      where: { userId },
      select: { targetRole: true },
    }),
  ]);

  if (!profile) {
    const emptyResult = calculateCompletionScore({
      id: "",
      userId,
      headline: null,
      summary: null,
      avatarUrl: null,
      bannerUrl: null,
      city: null,
      state: null,
      country: null,
      pinCode: null,
      currentCompany: null,
      currentRole: null,
      totalExpYears: null,
      noticePeriod: null,
      currentCTC: null,
      expectedCTC: null,
      ctcCurrency: null,
      workMode: null,
      openToWork: false,
      openToWorkVisibility: "RECRUITERS_ONLY",
      visibility: "PUBLIC",
      hideFromCompanies: [],
      completionScore: 0,
      username: null,
      profileViews: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      defaultResumeVisibility: "RECRUITERS_ONLY",
      experiences: [],
      educations: [],
      certifications: [],
      projects: [],
      awards: [],
      languages: [],
      volunteerWork: [],
      publications: [],
      skills: [],
      resumes: [],
    } as FullProfile);
    return NextResponse.json({
      success: true,
      data: { completion: emptyResult, profileViews: 0, headline: null },
    });
  }

  const completion = calculateCompletionScore(profile as FullProfile, {
    targetRole: careerContext?.targetRole ?? undefined,
  });

  return NextResponse.json({
    success: true,
    data: {
      completion,
      profileViews: profile.profileViews ?? 0,
      headline: profile.headline,
    },
  });
}
