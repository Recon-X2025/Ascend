import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api/middleware";
import { prisma } from "@/lib/prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiAuth(request, "candidates:read", async (_req, { apiKey }) => {
    const { id: candidateId } = await params;

    const applicationCount = await prisma.jobApplication.count({
      where: {
        applicantId: candidateId,
        jobPost: { companyId: apiKey.companyId },
      },
    });

    if (applicationCount === 0) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: candidateId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        jobSeekerProfile: {
          select: {
            headline: true,
            summary: true,
            currentRole: true,
            city: true,
            totalExpYears: true,
            educations: true,
            skills: { select: { skill: { select: { name: true } } } },
            experiences: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const profile = user.jobSeekerProfile;
    return NextResponse.json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        headline: profile?.headline ?? null,
        summary: profile?.summary ?? null,
        currentRole: profile?.currentRole ?? null,
        location: profile?.city ?? null,
        yearsOfExperience: profile?.totalExpYears ?? null,
        education: profile?.educations ?? [],
        skills: (profile?.skills ?? []).map((s) => s.skill.name),
        experiences: profile?.experiences ?? [],
      },
    });
  });
}
