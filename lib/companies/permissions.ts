/**
 * Company admin permissions. All write routes (PATCH, POST, DELETE) for a company
 * must check isCompanyAdmin with OWNER or ADMIN (or MEMBER for limited actions).
 */

import { prisma } from "@/lib/prisma/client";
import type { CompanyAdminRole } from "@prisma/client";

export async function getCompanyRole(
  userId: string,
  companyId: string
): Promise<CompanyAdminRole | null> {
  const admin = await prisma.companyAdmin.findUnique({
    where: { companyId_userId: { companyId, userId } },
    select: { role: true },
  });
  return admin?.role ?? null;
}

export async function isCompanyAdmin(
  userId: string,
  companyId: string,
  minRole: CompanyAdminRole = "MEMBER"
): Promise<boolean> {
  const role = await getCompanyRole(userId, companyId);
  if (!role) return false;
  const order: CompanyAdminRole[] = ["MEMBER", "ADMIN", "OWNER"];
  return order.indexOf(role) >= order.indexOf(minRole);
}

export async function isCompanyOwner(userId: string, companyId: string): Promise<boolean> {
  const role = await getCompanyRole(userId, companyId);
  return role === "OWNER";
}

export async function isCompanyOwnerOrAdmin(userId: string, companyId: string): Promise<boolean> {
  return isCompanyAdmin(userId, companyId, "ADMIN");
}
