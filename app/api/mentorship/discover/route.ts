import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { computeReadiness } from "@/lib/mentorship/readiness";
import { discoverMentors } from "@/lib/mentorship/discover";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { check } = await computeReadiness(session.user.id);

    if (!check.allGatesPassed) {
      return NextResponse.json(
        {
          gateBlocked: true,
          check: {
            allGatesPassed: check.allGatesPassed,
            profileComplete: check.profileComplete,
            careerContextComplete: check.careerContextComplete,
            transitionDeclared: check.transitionDeclared,
          },
        },
        { status: 403 }
      );
    }

    const matches = await discoverMentors(session.user.id);

    const payload = matches.map((m) => ({
      mentorProfileId: m.mentorProfile.id,
      mentorUserId: m.mentorProfile.userId,
      mentorName: m.mentorProfile.user.name,
      mentorImage: m.mentorProfile.user.image,
      matchReason: m.matchReason,
      profile: {
        fromRole: m.mentorProfile.fromRole,
        fromCompanyType: m.mentorProfile.fromCompanyType,
        toRole: m.mentorProfile.toRole,
        toCompanyType: m.mentorProfile.toCompanyType,
        transitionDurationMonths: m.mentorProfile.transitionDurationMonths,
        transitionYear: m.mentorProfile.transitionYear,
        toCity: m.mentorProfile.toCity,
        m2FocusAreas: m.mentorProfile.m2FocusAreas,
        sessionFrequency: m.mentorProfile.sessionFrequency,
        maxActiveMentees: m.mentorProfile.maxActiveMentees,
        currentMenteeCount: m.mentorProfile.currentMenteeCount,
        availabilityWindows: m.mentorProfile.availabilityWindows ?? [],
      },
    }));

    return NextResponse.json(payload);
  } catch (e) {
    console.error("[mentorship/discover] GET error:", e);
    return NextResponse.json(
      { error: "Failed to load mentor matches" },
      { status: 500 }
    );
  }
}
