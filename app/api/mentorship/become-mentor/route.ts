import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { emitSignal } from "@/lib/signals/emit";
import { SignalType } from "@prisma/client";
import type {
  MentorTransition,
  MentorStyle,
  SessionFormat,
  MentorFocusArea,
} from "@prisma/client";

function parseBody(body: unknown): {
  agreedToList?: boolean;
  currentRole: string;
  currentCompany?: string;
  previousRole?: string;
  transitionType?: MentorTransition;
  yearsOfExperience: number;
  currentCity?: string;
  previousCity?: string;
  crossBorderExperience?: boolean;
  countriesWorkedIn?: string[];
  mentoringStyles: MentorStyle[];
  sessionFormats: SessionFormat[];
  languages?: string[];
  focusAreas: MentorFocusArea[];
  maxMenteesPerMonth: number;
  availability: { dayOfWeek: number; startTime: string; endTime: string; timezone?: string }[];
} | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const currentRole = typeof o.currentRole === "string" ? o.currentRole.trim() : "";
  if (!currentRole) return null;
  const yearsOfExperience =
    typeof o.yearsOfExperience === "number" && o.yearsOfExperience >= 0
      ? o.yearsOfExperience
      : 0;
  const maxMenteesPerMonth =
    typeof o.maxMenteesPerMonth === "number" && o.maxMenteesPerMonth >= 1
      ? Math.min(10, o.maxMenteesPerMonth)
      : 3;

  const mentoringStyles = Array.isArray(o.mentoringStyles)
    ? (o.mentoringStyles.filter((x): x is MentorStyle => typeof x === "string") as MentorStyle[])
    : [];
  const sessionFormats = Array.isArray(o.sessionFormats)
    ? (o.sessionFormats.filter((x): x is SessionFormat => typeof x === "string") as SessionFormat[])
    : [];
  const focusAreas = Array.isArray(o.focusAreas)
    ? (o.focusAreas.filter((x): x is MentorFocusArea => typeof x === "string") as MentorFocusArea[])
    : [];
  const availability = Array.isArray(o.availability)
    ? o.availability
        .filter(
          (x): x is { dayOfWeek: number; startTime: string; endTime: string; timezone?: string } =>
            typeof x === "object" &&
            x !== null &&
            typeof (x as { dayOfWeek?: unknown }).dayOfWeek === "number" &&
            typeof (x as { startTime?: unknown }).startTime === "string" &&
            typeof (x as { endTime?: unknown }).endTime === "string"
        )
        .map((x) => ({
          dayOfWeek: x.dayOfWeek,
          startTime: x.startTime,
          endTime: x.endTime,
          timezone: typeof x.timezone === "string" ? x.timezone : "Asia/Kolkata",
        }))
    : [];

  return {
    agreedToList: o.agreedToList === true,
    currentRole,
    currentCompany: typeof o.currentCompany === "string" ? o.currentCompany.trim() || undefined : undefined,
    previousRole: typeof o.previousRole === "string" ? o.previousRole.trim() || undefined : undefined,
    transitionType: typeof o.transitionType === "string" ? (o.transitionType as MentorTransition) : undefined,
    yearsOfExperience,
    currentCity: typeof o.currentCity === "string" ? o.currentCity.trim() || undefined : undefined,
    previousCity: typeof o.previousCity === "string" ? o.previousCity.trim() || undefined : undefined,
    crossBorderExperience: o.crossBorderExperience === true,
    countriesWorkedIn: Array.isArray(o.countriesWorkedIn)
      ? o.countriesWorkedIn.filter((x): x is string => typeof x === "string")
      : [],
    mentoringStyles,
    sessionFormats: sessionFormats.length ? sessionFormats : ["VIDEO_CALL"],
    languages: Array.isArray(o.languages)
      ? o.languages.filter((x): x is string => typeof x === "string")
      : ["English"],
    focusAreas,
    maxMenteesPerMonth,
    availability,
  };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { checkMarketplaceAccess } = await import("@/lib/mentorship/legal/signatures");
  const { hasAccess, missing } = await checkMarketplaceAccess(session.user.id, "MENTOR");
  if (!hasAccess && missing.length > 0) {
    const { trackOutcome } = await import("@/lib/tracking/outcomes");
    await trackOutcome(session.user.id, "M15_LEGAL_GATE_BLOCKED", {
      entityType: "MentorProfile",
      metadata: { documentType: missing[0], blockedRoute: "POST /api/mentorship/become-mentor" },
    });
    const baseUrl = process.env.NEXTAUTH_URL ?? "";
    const firstType = missing[0];
    return NextResponse.json(
      {
        error: "You must sign all required legal documents before becoming a mentor.",
        code: "LEGAL_SIGNATURE_REQUIRED",
        type: firstType,
        missing,
        redirectTo: `${baseUrl}/mentorship/legal/sign/${firstType}?next=${encodeURIComponent("/mentorship/become-a-mentor")}`,
      },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const data = parseBody(body);
  if (!data) {
    return NextResponse.json({ success: false, error: "Invalid body: currentRole and yearsOfExperience required" }, { status: 400 });
  }

  if (data.agreedToList) {
    const { getUserPlan } = await import("@/lib/payments/gate");
    const plan = await getUserPlan(session.user.id);
    if (plan !== "MENTOR_MARKETPLACE") {
      const baseUrl = process.env.NEXTAUTH_URL ?? "";
      return NextResponse.json(
        {
          error: "Subscribe to the mentor marketplace to list your profile.",
          code: "SUBSCRIPTION_REQUIRED",
          redirectTo: `${baseUrl}/dashboard/mentor/subscription`,
        },
        { status: 402 }
      );
    }
  }

  const existing = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (existing) {
    const roleOrCompanyChanged =
      data.currentRole !== existing.currentRole ||
      (data.currentCompany ?? null) !== existing.currentCompany;

    const [updated] = await prisma.$transaction([
      prisma.mentorProfile.update({
        where: { userId: session.user.id },
        data: {
          currentRole: data.currentRole,
          currentCompany: data.currentCompany ?? null,
          previousRole: data.previousRole ?? null,
          transitionType: data.transitionType ?? null,
          yearsOfExperience: data.yearsOfExperience,
          currentCity: data.currentCity ?? null,
          previousCity: data.previousCity ?? null,
          crossBorderExperience: data.crossBorderExperience ?? false,
          countriesWorkedIn: data.countriesWorkedIn ?? [],
          mentoringStyles: data.mentoringStyles,
          sessionFormats: data.sessionFormats,
          languages: data.languages ?? ["English"],
          focusAreas: data.focusAreas,
          maxMenteesPerMonth: data.maxMenteesPerMonth,
          ...(roleOrCompanyChanged
            ? {
                verificationStatus: "REVERIFICATION_REQUIRED" as const,
                isDiscoverable: false,
              }
            : {}),
        },
      }),
      prisma.mentorAvailability.deleteMany({
        where: { mentorProfileId: existing.id },
      }),
    ]);

    if (roleOrCompanyChanged) {
      await prisma.mentorVerification
        .updateMany({
          where: { mentorProfileId: existing.id },
          data: { status: "REVERIFICATION_REQUIRED" },
        })
        .catch(() => {});
    }

    if (data.availability.length) {
      await prisma.mentorAvailability.createMany({
        data: data.availability.map((a) => ({
          mentorProfileId: updated.id,
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          timezone: a.timezone ?? "Asia/Kolkata",
        })),
      });
    }
    return NextResponse.json({ success: true, mentorProfileId: updated.id });
  }

  const mentorProfile = await prisma.$transaction(async (tx) => {
    const created = await tx.mentorProfile.create({
      data: {
        userId: session.user!.id!,
        currentRole: data.currentRole,
        currentCompany: data.currentCompany ?? null,
        previousRole: data.previousRole ?? null,
        transitionType: data.transitionType ?? null,
        yearsOfExperience: data.yearsOfExperience,
        currentCity: data.currentCity ?? null,
        previousCity: data.previousCity ?? null,
        crossBorderExperience: data.crossBorderExperience ?? false,
        countriesWorkedIn: data.countriesWorkedIn ?? [],
        mentoringStyles: data.mentoringStyles,
        sessionFormats: data.sessionFormats,
        languages: data.languages ?? ["English"],
        focusAreas: data.focusAreas,
        maxMenteesPerMonth: data.maxMenteesPerMonth,
      },
    });
    if (data.availability.length) {
      await tx.mentorAvailability.createMany({
        data: data.availability.map((a) => ({
          mentorProfileId: created.id,
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          timezone: a.timezone ?? "Asia/Kolkata",
        })),
      });
    }
    return created;
  });

  await emitSignal({
    type: SignalType.MENTOR_PROFILE_CREATED,
    actorId: session.user.id,
    audienceUserIds: [session.user.id],
    metadata: { role: data.currentRole },
  });

  return NextResponse.json({ success: true, mentorProfileId: mentorProfile.id });
}
