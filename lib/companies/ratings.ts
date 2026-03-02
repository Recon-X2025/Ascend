/**
 * Aggregate company ratings from approved reviews.
 */

import { prisma } from "@/lib/prisma/client";

export interface CompanyRatingAggregate {
  overallAvg: number;
  workLifeAvg: number;
  salaryAvg: number;
  cultureAvg: number;
  careerAvg: number;
  managementAvg: number;
  recommendPct: number;
  ceoApprovalPct: number | null;
  reviewCount: number;
}

export async function getCompanyRatingAggregate(companyId: string): Promise<CompanyRatingAggregate | null> {
  const reviews = await prisma.companyReview.findMany({
    where: { companyId, status: "APPROVED" },
    select: {
      overallRating: true,
      workLifeRating: true,
      salaryRating: true,
      cultureRating: true,
      careerRating: true,
      managementRating: true,
      recommend: true,
      ceoApproval: true,
      ceoApprovalRating: true,
    },
  });
  if (reviews.length === 0) return null;
  const n = reviews.length;
  const sum = (key: keyof typeof reviews[0]) =>
    reviews.reduce((a, r) => a + (typeof r[key] === "number" ? (r[key] as number) : 0), 0);
  const count = (key: keyof typeof reviews[0]) =>
    reviews.filter((r) => r[key] != null && typeof r[key] === "number").length;
  const avg = (key: keyof typeof reviews[0]) => {
    const c = count(key);
    return c === 0 ? 0 : Math.round((sum(key) / c) * 10) / 10;
  };
  const recommendCount = reviews.filter((r) => r.recommend).length;
  const ceoApprovalRelevant = reviews.filter(
    (r) => r.ceoApprovalRating != null || r.ceoApproval !== null
  );
  const ceoApprovalCount = ceoApprovalRelevant.filter(
    (r) => r.ceoApprovalRating === "APPROVE" || r.ceoApproval === true
  ).length;
  return {
    overallAvg: Math.round((sum("overallRating") / n) * 10) / 10,
    workLifeAvg: avg("workLifeRating"),
    salaryAvg: avg("salaryRating"),
    cultureAvg: avg("cultureRating"),
    careerAvg: avg("careerRating"),
    managementAvg: avg("managementRating"),
    recommendPct: Math.round((recommendCount / n) * 100),
    ceoApprovalPct:
      ceoApprovalRelevant.length > 0
        ? Math.round((ceoApprovalCount / ceoApprovalRelevant.length) * 100)
        : null,
    reviewCount: n,
  };
}
