import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const company = await prisma.company.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      industry: true,
      hq: true,
      insight: true,
    },
  });

  if (!company) {
    return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
  }

  const insight =
    company.insight ??
    (await prisma.companyInsight.findFirst({
      where: { companyName: { equals: company.name, mode: "insensitive" } },
    }));

  let resultInsight = insight;
  if (!resultInsight && company.industry && company.hq) {
    const key = `${company.industry}::${company.hq}`;
    const industryInsight = await prisma.companyInsight.findUnique({
      where: { industryLocation: key },
    });
    if (industryInsight) resultInsight = industryInsight;
  }

  return NextResponse.json({
    insight: resultInsight ?? null,
    type: resultInsight ? (resultInsight.industryLocation ? "industry" : "company") : null,
  });
}
