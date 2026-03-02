import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import {
  mentorProfileCreateSchema,
  mentorProfileUpdateSchema,
} from "@/lib/mentorship/profile";
import sanitizeHtml from "sanitize-html";

const MAX_ACTIVE_MENTEES_CAP = 6; // ELITE tier; RISING = 2

function sanitize(str: string): string {
  return sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} }).trim();
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      availabilityWindows: true,
    },
  });

  if (!profile) {
    return NextResponse.json({ profile: null });
  }

  return NextResponse.json({
    profile: {
      ...profile,
      verificationStatus: profile.verificationStatus,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Mentor profile already exists; use PATCH to update" },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = mentorProfileCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const maxActiveMentees = Math.min(
    Math.max(1, data.maxActiveMentees),
    MAX_ACTIVE_MENTEES_CAP
  );

  const profile = await prisma.mentorProfile.create({
    data: {
      userId: session.user.id,
      currentRole: data.toRole,
      previousRole: data.fromRole,
      yearsOfExperience: Math.max(1, Math.ceil(data.transitionDurationMonths / 12)),
      fromRole: data.fromRole,
      fromCompanyType: data.fromCompanyType,
      fromIndustry: sanitize(data.fromIndustry),
      fromCity: sanitize(data.fromCity),
      toRole: data.toRole,
      toCompanyType: data.toCompanyType,
      toIndustry: sanitize(data.toIndustry),
      toCity: sanitize(data.toCity),
      transitionDurationMonths: data.transitionDurationMonths,
      transitionYear: data.transitionYear,
      keyFactor1: sanitize(data.keyFactor1),
      keyFactor2: sanitize(data.keyFactor2),
      keyFactor3: sanitize(data.keyFactor3),
      statementTransitionMade: sanitize(data.statementTransitionMade),
      statementWishIKnew: sanitize(data.statementWishIKnew),
      statementCanHelpWith: sanitize(data.statementCanHelpWith),
      statementCannotHelpWith: sanitize(data.statementCannotHelpWith),
      maxActiveMentees,
      engagementPreference: data.engagementPreference,
      sessionFrequency: data.sessionFrequency,
      timezone: data.timezone,
      m2FocusAreas: data.m2FocusAreas,
      languages: data.languages,
      geographyScope: data.geographyScope,
      geographyCountries: data.geographyCountries,
      isActive: false,
      isPublic: false,
      availabilityWindows: {
        create: data.availabilityWindows.map((w) => ({
          dayOfWeek: w.dayOfWeek,
          startTime: w.startTime,
          endTime: w.endTime,
        })),
      },
    },
    include: { availabilityWindows: true },
  });

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });
    if (user?.email) {
      const { sendMentorProfileReceivedEmail } = await import("@/lib/email/mentor");
      await sendMentorProfileReceivedEmail(user.email);
    }
  } catch {
    // ignore email failure
  }

  return NextResponse.json({ profile });
}

export async function PATCH(req: NextRequest) {
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

  const parsed = mentorProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Mentor profile not found; use POST to create" },
      { status: 404 }
    );
  }

  const data = parsed.data;

  // Never allow mentor to set isPublic or transitionBadge to PLATFORM_VERIFIED
  const update: Record<string, unknown> = {};

  if (data.fromRole !== undefined) update.fromRole = data.fromRole;
  if (data.fromCompanyType !== undefined) update.fromCompanyType = data.fromCompanyType;
  if (data.fromIndustry !== undefined) update.fromIndustry = sanitize(data.fromIndustry);
  if (data.fromCity !== undefined) update.fromCity = sanitize(data.fromCity);
  if (data.toRole !== undefined) {
    update.toRole = data.toRole;
    update.currentRole = data.toRole;
  }
  if (data.toCompanyType !== undefined) update.toCompanyType = data.toCompanyType;
  if (data.toIndustry !== undefined) update.toIndustry = sanitize(data.toIndustry);
  if (data.toCity !== undefined) update.toCity = sanitize(data.toCity);
  if (data.transitionDurationMonths !== undefined)
    update.transitionDurationMonths = data.transitionDurationMonths;
  if (data.transitionYear !== undefined) update.transitionYear = data.transitionYear;
  if (data.keyFactor1 !== undefined) update.keyFactor1 = sanitize(data.keyFactor1);
  if (data.keyFactor2 !== undefined) update.keyFactor2 = sanitize(data.keyFactor2);
  if (data.keyFactor3 !== undefined) update.keyFactor3 = sanitize(data.keyFactor3);
  if (data.statementTransitionMade !== undefined)
    update.statementTransitionMade = sanitize(data.statementTransitionMade);
  if (data.statementWishIKnew !== undefined)
    update.statementWishIKnew = sanitize(data.statementWishIKnew);
  if (data.statementCanHelpWith !== undefined)
    update.statementCanHelpWith = sanitize(data.statementCanHelpWith);
  if (data.statementCannotHelpWith !== undefined)
    update.statementCannotHelpWith = sanitize(data.statementCannotHelpWith);
  if (data.maxActiveMentees !== undefined)
    update.maxActiveMentees = Math.min(
      Math.max(1, data.maxActiveMentees),
      MAX_ACTIVE_MENTEES_CAP
    );
  if (data.engagementPreference !== undefined)
    update.engagementPreference = data.engagementPreference;
  if (data.sessionFrequency !== undefined) update.sessionFrequency = data.sessionFrequency;
  if (data.timezone !== undefined) update.timezone = data.timezone;
  if (data.m2FocusAreas !== undefined) update.m2FocusAreas = data.m2FocusAreas;
  if (data.languages !== undefined) update.languages = data.languages;
  if (data.geographyScope !== undefined) update.geographyScope = data.geographyScope;
  if (data.geographyCountries !== undefined)
    update.geographyCountries = data.geographyCountries;

  if (data.availabilityWindows !== undefined && data.availabilityWindows.length > 0) {
    await prisma.availabilityWindow.deleteMany({
      where: { mentorProfileId: existing.id },
    });
    await prisma.availabilityWindow.createMany({
      data: data.availabilityWindows.map((w) => ({
        mentorProfileId: existing.id,
        dayOfWeek: w.dayOfWeek,
        startTime: w.startTime,
        endTime: w.endTime,
      })),
    });
  }

  const profile = await prisma.mentorProfile.update({
    where: { userId: session.user.id },
    data: update as Parameters<typeof prisma.mentorProfile.update>[0]["data"],
    include: { availabilityWindows: true },
  });

  return NextResponse.json({ profile });
}
