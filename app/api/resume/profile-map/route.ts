import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import {
  scoreExperiences,
  scoreSkills,
  scoreEducations,
  scoreCertifications,
  scoreProjects,
  scoreAwards,
} from "@/lib/resume/profile-map-relevance";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const careerIntentId = searchParams.get("careerIntentId");
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
          experiences: { orderBy: [{ isCurrent: "desc" }, { endYear: "desc" }, { startYear: "desc" }] },
          educations: { orderBy: [{ endYear: "desc" }, { startYear: "desc" }] },
          certifications: { orderBy: { issueYear: "desc" } },
          projects: { orderBy: [{ isCurrent: "desc" }, { endYear: "desc" }] },
          awards: { orderBy: { year: "desc" } },
          skills: { include: { skill: { select: { name: true } } }, orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!intent || intent.userId !== userId) {
    return NextResponse.json({ success: false, error: "Career intent not found" }, { status: 404 });
  }

  const profile = intent.profile;
  const targetRole = intent.targetRole;

  const experiences = scoreExperiences(
    profile.experiences.map((e) => ({
      id: e.id,
      company: e.company,
      designation: e.designation,
      startYear: e.startYear,
      endYear: e.endYear,
      isCurrent: e.isCurrent,
      order: e.order,
    })),
    targetRole
  );

  const educations = scoreEducations(
    profile.educations.map((e) => ({
      id: e.id,
      institution: e.institution,
      degree: e.degree,
      fieldOfStudy: e.fieldOfStudy,
      endYear: e.endYear,
      isCurrent: e.isCurrent,
      order: e.order,
    })),
    targetRole
  );

  const skills = scoreSkills(
    profile.skills.map((s) => ({
      id: s.id,
      skillId: s.skillId,
      skill: s.skill,
      proficiency: s.proficiency,
      order: s.order,
    })),
    targetRole
  );

  const certifications = scoreCertifications(
    profile.certifications.map((c) => ({
      id: c.id,
      name: c.name,
      issuingOrg: c.issuingOrg,
      issueYear: c.issueYear,
      order: c.order,
    })),
    targetRole
  );

  const projects = scoreProjects(
    profile.projects.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      endYear: p.endYear,
      isCurrent: p.isCurrent,
      order: p.order,
    })),
    targetRole
  );

  const awards = scoreAwards(
    profile.awards.map((a) => ({
      id: a.id,
      title: a.title,
      issuer: a.issuer,
      year: a.year,
      order: a.order,
    })),
    targetRole
  );

  return NextResponse.json({
    success: true,
    data: {
      careerIntent: {
        id: intent.id,
        targetRole: intent.targetRole,
        targetIndustry: intent.targetIndustry,
        switchingIndustry: intent.switchingIndustry,
        fromIndustry: intent.fromIndustry,
        toIndustry: intent.toIndustry,
      },
      experiences,
      educations,
      skills,
      certifications,
      projects,
      awards,
    },
  });
}
