/**
 * Phase 16B: Recruiter intelligence auth. All routes require RECRUITER or COMPANY_ADMIN.
 * Verify session.user.companyId or job/application ownership via canManageJob.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { canManageJob } from "@/lib/jobs/permissions";
import { isCompanyOwnerOrAdmin } from "@/lib/companies/permissions";

export async function requireRecruiterSession(): Promise<
  { userId: string; role: string } | { error: Response }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }) };
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "RECRUITER" && role !== "COMPANY_ADMIN") {
    return { error: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }) };
  }
  return { userId: session.user.id, role };
}

/** Company IDs the user can see (jobs they recruit for + companies they admin). */
export async function getRecruiterCompanyIds(userId: string): Promise<string[]> {
  const [jobCompanies, adminCompanies] = await Promise.all([
    prisma.jobPost.findMany({
      where: { recruiterId: userId, companyId: { not: null } },
      select: { companyId: true },
      distinct: ["companyId"],
    }),
    prisma.companyAdmin.findMany({
      where: { userId },
      select: { companyId: true },
    }),
  ]);
  const fromJobs = jobCompanies.map((j) => j.companyId).filter((id): id is string => id != null);
  const fromAdmin = adminCompanies.map((a) => a.companyId);
  return Array.from(new Set([...fromJobs, ...fromAdmin]));
}

export async function assertCompanyAccess(userId: string, companyId: string): Promise<boolean> {
  const jobWithCompany = await prisma.jobPost.findFirst({
    where: { companyId, OR: [{ recruiterId: userId }] },
    select: { id: true },
  });
  if (jobWithCompany) return true;
  return isCompanyOwnerOrAdmin(userId, companyId);
}

export async function assertApplicationAccess(
  userId: string,
  applicationId: string
): Promise<boolean> {
  const app = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    select: { jobPostId: true },
  });
  return app ? canManageJob(userId, app.jobPostId) : false;
}
