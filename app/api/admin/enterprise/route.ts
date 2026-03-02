import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { PlanType } from "@prisma/client";

const ENTERPRISE_PLAN: PlanType = "RECRUITER_ENTERPRISE";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const companies = await prisma.company.findMany({
    where: {
      subscription: {
        plan: ENTERPRISE_PLAN,
        status: "ACTIVE",
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      subscription: { select: { plan: true } },
      _count: {
        select: {
          companyApiKeys: true,
        },
      },
      atsIntegration: {
        select: { provider: true, isActive: true },
      },
    },
  });

  return NextResponse.json({
    data: companies.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      plan: c.subscription?.plan ?? null,
      apiKeyCount: c._count.companyApiKeys,
      atsProvider: c.atsIntegration?.provider ?? null,
      atsActive: c.atsIntegration?.isActive ?? false,
    })),
  });
}
