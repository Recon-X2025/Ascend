import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { track, EVENTS } from "@/lib/analytics/track";
import type {
  UserCareerContext,
  CareerEmploymentStatus,
  CareerNoticePeriod,
  SearchUrgency,
  SearchReason,
  PrimaryNeed,
  TargetCompanySizeBand,
  TargetGeography,
  ExperienceBand,
} from "@prisma/client";

const CORE_POINTS = 15;
const SUPPORTING_POINTS = 5;

function computeCompletionScore(ctx: Partial<UserCareerContext>): number {
  let score = 0;
  if (ctx.currentRole?.trim()) score += CORE_POINTS;
  if (ctx.targetRole?.trim()) score += CORE_POINTS;
  if (ctx.yearsOfExperience != null) score += CORE_POINTS;
  if (ctx.targetLocations?.length) score += CORE_POINTS;
  if (ctx.employmentStatus) score += CORE_POINTS;
  if (ctx.currentSalary != null) score += SUPPORTING_POINTS;
  if (ctx.noticePeriod) score += SUPPORTING_POINTS;
  if (ctx.searchReason) score += SUPPORTING_POINTS;
  if (ctx.targetSalaryMin != null) score += SUPPORTING_POINTS;
  if (ctx.openToRemote != null) score += SUPPORTING_POINTS;
  return Math.min(100, score);
}

type CareerContextPayload = {
  currentRole?: string | null;
  currentCompany?: string | null;
  currentSalary?: number | null;
  yearsOfExperience?: number | null;
  experienceBand?: ExperienceBand | null;
  targetRole?: string | null;
  targetIndustry?: string[] | null;
  targetCompanySize?: TargetCompanySizeBand | null;
  targetCompanyType?: string[] | null;
  targetSalaryMin?: number | null;
  targetLocations?: string[] | null;
  openToRelocation?: boolean | null;
  openToRemote?: boolean | null;
  employmentStatus?: CareerEmploymentStatus | null;
  noticePeriod?: CareerNoticePeriod | null;
  urgency?: SearchUrgency | null;
  searchReason?: SearchReason | null;
  primaryNeed?: PrimaryNeed | null;
  secondaryNeeds?: PrimaryNeed[] | null;
  isFirstJob?: boolean | null;
  isSwitchingField?: boolean | null;
  targetGeography?: TargetGeography | null;
};

function parseBody(body: unknown): CareerContextPayload | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const payload: CareerContextPayload = {};
  if (typeof o.currentRole === "string") payload.currentRole = o.currentRole || null;
  if (typeof o.currentCompany === "string") payload.currentCompany = o.currentCompany || null;
  if (typeof o.currentSalary === "number") payload.currentSalary = o.currentSalary;
  if (o.currentSalary === null) payload.currentSalary = null;
  if (typeof o.yearsOfExperience === "number") payload.yearsOfExperience = o.yearsOfExperience;
  if (o.yearsOfExperience === null) payload.yearsOfExperience = null;
  if (typeof o.experienceBand === "string") payload.experienceBand = o.experienceBand as ExperienceBand;
  if (typeof o.targetRole === "string") payload.targetRole = o.targetRole || null;
  if (Array.isArray(o.targetIndustry)) payload.targetIndustry = o.targetIndustry.filter((x): x is string => typeof x === "string");
  if (typeof o.targetCompanySize === "string") payload.targetCompanySize = o.targetCompanySize as TargetCompanySizeBand;
  if (Array.isArray(o.targetCompanyType)) payload.targetCompanyType = o.targetCompanyType.filter((x): x is string => typeof x === "string");
  if (typeof o.targetSalaryMin === "number") payload.targetSalaryMin = o.targetSalaryMin;
  if (o.targetSalaryMin === null) payload.targetSalaryMin = null;
  if (Array.isArray(o.targetLocations)) payload.targetLocations = o.targetLocations.filter((x): x is string => typeof x === "string");
  if (typeof o.openToRelocation === "boolean") payload.openToRelocation = o.openToRelocation;
  if (typeof o.openToRemote === "boolean") payload.openToRemote = o.openToRemote;
  if (typeof o.employmentStatus === "string") payload.employmentStatus = o.employmentStatus as CareerEmploymentStatus;
  if (typeof o.noticePeriod === "string") payload.noticePeriod = o.noticePeriod as CareerNoticePeriod;
  if (typeof o.urgency === "string") payload.urgency = o.urgency as SearchUrgency;
  if (typeof o.searchReason === "string") payload.searchReason = o.searchReason as SearchReason;
  if (typeof o.primaryNeed === "string") payload.primaryNeed = o.primaryNeed as PrimaryNeed;
  if (Array.isArray(o.secondaryNeeds)) payload.secondaryNeeds = o.secondaryNeeds.filter((x): x is PrimaryNeed => typeof x === "string") as PrimaryNeed[];
  if (typeof o.isFirstJob === "boolean") payload.isFirstJob = o.isFirstJob;
  if (typeof o.isSwitchingField === "boolean") payload.isSwitchingField = o.isSwitchingField;
  if (typeof o.targetGeography === "string") payload.targetGeography = o.targetGeography as TargetGeography;
  return payload;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const ctx = await prisma.userCareerContext.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ success: true, careerContext: ctx });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const payload = parseBody(body);
  if (!payload) {
    return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
  }

  const existing = await prisma.userCareerContext.findUnique({
    where: { userId: session.user.id },
  });

  // Only overwrite fields that were actually sent (preserve existing for partial updates)
  const payloadOnly = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined)
  ) as Partial<UserCareerContext>;
  const merged = {
    ...(existing ?? {}),
    ...payloadOnly,
  } as UserCareerContext;
  const completionScore = computeCompletionScore(merged);

  const updated = await prisma.userCareerContext.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...payloadOnly,
      completionScore,
      contextSetAt: new Date(),
    },
    update: {
      ...payloadOnly,
      completionScore,
    },
  });

  const { queueMatchRefresh } = await import("@/lib/mentorship/refresh-matches");
  queueMatchRefresh(session.user.id).catch(() => {});

  return NextResponse.json({ success: true, careerContext: updated });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    const payload = parseBody(body);
    if (!payload) {
      return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
    }

    const existing = await prisma.userCareerContext.findUnique({
      where: { userId: session.user.id },
    });

    // Only overwrite fields that were actually sent (preserve existing for partial updates)
    const payloadOnly = Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined)
    ) as Partial<UserCareerContext>;
    const merged = {
      ...(existing ?? {}),
      ...payloadOnly,
    } as UserCareerContext;
    const completionScore = computeCompletionScore(merged);

    await prisma.$transaction([
      prisma.userCareerContext.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          ...payloadOnly,
          completionScore,
          contextSetAt: new Date(),
        },
        update: {
          ...payloadOnly,
          completionScore,
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { onboardingComplete: true },
      }),
    ]);

    track(EVENTS.CONTEXT_COMPLETED, { completionScore }, { userId: session.user.id, persona: (session.user as { persona?: string }).persona ?? undefined }).catch(() => {});

    try {
      const { convertReferral } = await import("@/lib/growth/referral");
      await convertReferral(session.user.id);
    } catch {
      // Non-blocking: referral conversion must not block onboarding
    }

    try {
      const { queueMatchRefresh } = await import("@/lib/mentorship/refresh-matches");
      queueMatchRefresh(session.user.id).catch(() => {});
    } catch {
      // Non-blocking: mentorship match refresh must not block onboarding
    }

    return NextResponse.json({ success: true, completionScore });
  } catch (e) {
    console.error("[career-context] POST error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to save career context" },
      { status: 500 }
    );
  }
}
