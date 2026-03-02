import type { Prisma } from "@prisma/client";

export const profileInclude = {
  experiences: true,
  educations: true,
  certifications: true,
  projects: true,
  awards: true,
  languages: true,
  volunteerWork: true,
  publications: true,
  skills: { include: { skill: { select: { name: true } } } },
  resumes: true,
} as const satisfies Prisma.JobSeekerProfileInclude;

export type ProfileWithRelations = Prisma.JobSeekerProfileGetPayload<{
  include: typeof profileInclude;
}>;
