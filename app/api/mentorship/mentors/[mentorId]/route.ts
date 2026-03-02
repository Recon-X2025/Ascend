import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mentorId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { mentorId } = await params;

  const mentor = await prisma.mentorProfile.findFirst({
    where: { id: mentorId, isActive: true },
    include: {
      user: { select: { id: true, name: true, image: true } },
      availability: true,
    },
  });

  if (!mentor) {
    return NextResponse.json({ success: false, error: "Mentor not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: mentor.id,
    userId: mentor.userId,
    name: mentor.user.name,
    image: mentor.user.image,
    currentRole: mentor.currentRole,
    currentCompany: mentor.currentCompany,
    previousRole: mentor.previousRole,
    transitionType: mentor.transitionType,
    yearsOfExperience: mentor.yearsOfExperience,
    currentCity: mentor.currentCity,
    previousCity: mentor.previousCity,
    crossBorderExperience: mentor.crossBorderExperience,
    countriesWorkedIn: mentor.countriesWorkedIn,
    mentoringStyles: mentor.mentoringStyles,
    sessionFormats: mentor.sessionFormats,
    languages: mentor.languages,
    focusAreas: mentor.focusAreas,
    totalSessions: mentor.totalSessions,
    totalMentees: mentor.totalMentees,
    averageRating: mentor.averageRating,
    featuredTestimonial: mentor.featuredTestimonial,
    isVerified: mentor.isVerified,
    availability: mentor.availability,
    tier: mentor.tier ?? "RISING",
  });
}
