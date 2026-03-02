/**
 * Phase 18B: Auto-grant CompanyEmployee when user's email domain matches a company's verifiedDomains.
 */

import { prisma } from "@/lib/prisma/client";
import { trackOutcome } from "@/lib/tracking/outcomes";

export async function grantCompanyEmployeeByEmail(userId: string, email: string): Promise<void> {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return;
  const companies = await prisma.company.findMany({
    where: {
      verifiedDomains: { has: domain },
    },
    select: { id: true },
  });
  for (const company of companies) {
    try {
      await prisma.companyEmployee.upsert({
        where: { userId_companyId: { userId, companyId: company.id } },
        create: { userId, companyId: company.id, domain, verifiedAt: new Date() },
        update: {},
      });
      trackOutcome(userId, "EMPLOYEE_VERIFIED", {
        entityType: "CompanyEmployee",
        entityId: company.id,
        metadata: { domain },
      }).catch(() => {});
    } catch {
      // ignore duplicate or constraint errors
    }
  }
}
