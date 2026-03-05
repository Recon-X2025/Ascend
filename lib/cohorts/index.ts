/**
 * BL-9: Cohort Communities — open groups by transition path.
 */

import { prisma } from "@/lib/prisma/client";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function listCohorts(transitionPath?: string) {
  const where = transitionPath ? { transitionPath } : {};
  return prisma.cohort.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { members: true, threads: true } },
    },
  });
}

export async function getCohortBySlug(slug: string) {
  return prisma.cohort.findUnique({
    where: { slug },
    include: {
      _count: { select: { members: true, threads: true } },
    },
  });
}

export async function joinCohort(cohortId: string, userId: string) {
  await prisma.cohortMember.upsert({
    where: {
      cohortId_userId: { cohortId, userId },
    },
    create: { cohortId, userId },
    update: {},
  });
}

export async function leaveCohort(cohortId: string, userId: string) {
  await prisma.cohortMember.deleteMany({
    where: { cohortId, userId },
  });
}

export async function isMember(cohortId: string, userId: string): Promise<boolean> {
  const m = await prisma.cohortMember.findUnique({
    where: { cohortId_userId: { cohortId, userId } },
  });
  return !!m;
}

export async function createThread(cohortId: string, authorId: string, content: string) {
  return prisma.cohortThread.create({
    data: { cohortId, authorId, content: content.slice(0, 5000) },
    include: {
      author: { select: { name: true, image: true } },
    },
  });
}

export async function getThreads(cohortId: string, limit = 50) {
  return prisma.cohortThread.findMany({
    where: { cohortId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      author: { select: { name: true, image: true } },
    },
  });
}

export async function createCohort(name: string, transitionPath: string, description?: string) {
  const slug = slugify(`${transitionPath}-${name}`) || slugify(name) || "cohort";
  let finalSlug = slug;
  let n = 0;
  while (true) {
    const existing = await prisma.cohort.findUnique({ where: { slug: finalSlug } });
    if (!existing) break;
    n++;
    finalSlug = `${slug}-${n}`;
  }
  return prisma.cohort.create({
    data: { name, transitionPath, slug: finalSlug, description },
  });
}
