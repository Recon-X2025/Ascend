/**
 * Job post permissions. PATCH/DELETE must use canManageJob.
 */

import { prisma } from "@/lib/prisma/client";
import { isCompanyOwnerOrAdmin } from "@/lib/companies/permissions";

export async function isJobOwner(userId: string, jobId: number): Promise<boolean> {
  const job = await prisma.jobPost.findUnique({
    where: { id: jobId },
    select: { recruiterId: true },
  });
  return job?.recruiterId === userId;
}

export async function canManageJob(userId: string, jobId: number): Promise<boolean> {
  const job = await prisma.jobPost.findUnique({
    where: { id: jobId },
    select: { recruiterId: true, companyId: true },
  });
  if (!job) return false;
  if (job.recruiterId === userId) return true;
  if (job.companyId) return isCompanyOwnerOrAdmin(userId, job.companyId);
  return false;
}
