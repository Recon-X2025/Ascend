import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma/client";
import { authOptions } from "@/lib/auth/nextauth";
import { jobSeekerOnboardingSchema, recruiterOnboardingSchema } from "@/lib/validations/auth";
import { generateUniqueUsername, slugFromName } from "@/lib/profile/username";
import { calculateCompletionScore } from "@/lib/profile/completion";
import { profileInclude } from "@/lib/profile/queries";
import type { FullProfile } from "@/lib/profile/completion";

const YEARS_MAP: Record<string, number> = { "0-1": 0.5, "1-3": 2, "3-5": 4, "5-10": 7.5, "10+": 10 };

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const role = body.role as string | undefined;
  if (role === "JOB_SEEKER") {
    const parsed = jobSeekerOnboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { name, headline, location, yearsOfExperience } = parsed.data;
    const totalExpYears = YEARS_MAP[yearsOfExperience] ?? null;
    const city = location?.trim() || null;
    const existing = await prisma.jobSeekerProfile.findUnique({ where: { userId: session.user.id } });
    const username = existing?.username ?? await generateUniqueUsername(slugFromName(name));
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { name, role: "JOB_SEEKER", onboardingComplete: true },
      }),
      prisma.jobSeekerProfile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          headline,
          city,
          totalExpYears,
          username,
        },
        update: { headline, city, totalExpYears },
      }),
    ]);
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId: session.user.id },
      include: profileInclude,
    });
    if (profile) {
      const result = calculateCompletionScore(profile as FullProfile);
      await prisma.jobSeekerProfile.update({
        where: { id: profile.id },
        data: { completionScore: result.total },
      });
    }
    return NextResponse.json({ success: true, data: { role: "JOB_SEEKER" } });
  }
  if (role === "RECRUITER") {
    const parsed = recruiterOnboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { name, companyName, designation, companySize } = parsed.data;
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { name, role: "RECRUITER", onboardingComplete: true },
      }),
      prisma.recruiterProfile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          companyName,
          designation,
          companySize,
        },
        update: { companyName, designation, companySize },
      }),
    ]);
    return NextResponse.json({ success: true, data: { role: "RECRUITER" } });
  }
  return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
}
