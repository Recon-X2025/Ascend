import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireRecruiterSession, getRecruiterCompanyIds } from "@/lib/recruiter-intelligence/auth";

export async function GET() {
  const auth = await requireRecruiterSession();
  if ("error" in auth) return auth.error;

  const companyIds = await getRecruiterCompanyIds(auth.userId);
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [companies, jobs] = await Promise.all([
    companyIds.length > 0
      ? prisma.company.findMany({
          where: { id: { in: companyIds } },
          select: { id: true, name: true },
        })
      : [],
    prisma.jobPost.findMany({
      where: {
        OR: [
          { recruiterId: auth.userId },
          ...(companyIds.length > 0 ? [{ companyId: { in: companyIds } }] : []),
        ],
        createdAt: { gte: ninetyDaysAgo },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: { id: true, title: true, companyId: true, status: true },
    }),
  ]);

  return NextResponse.json({
    companies,
    jobs,
  });
}
