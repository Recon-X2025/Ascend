import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { jobListInclude } from "@/lib/jobs/queries";

type Params = { params: Promise<{ slug: string }> };

export async function GET(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const company = await prisma.company.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });
  if (!company) {
    return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
  }
  const employee = await prisma.companyEmployee.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId: company.id } },
  });
  if (!employee) {
    return NextResponse.json(
      { error: "For verified employees only", code: "NOT_EMPLOYEE" },
      { status: 403 }
    );
  }
  const jobs = await prisma.jobPost.findMany({
    where: {
      companyId: company.id,
      visibility: { in: ["INTERNAL", "PUBLIC"] },
      status: "ACTIVE",
    },
    include: jobListInclude,
    orderBy: { publishedAt: "desc" },
  });
  const data = jobs.map((j) => {
    const row = j as typeof j & { companyRef?: { id: string; slug: string; name: string; logo: string | null; verified: boolean } | null; skills: { skill: { id: string; name: string }; required: boolean }[] };
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      type: row.type,
      workMode: row.workMode,
      locations: row.locations,
      salaryVisible: row.salaryVisible,
      salaryMin: row.salaryMin,
      salaryMax: row.salaryMax,
      salaryCurrency: row.salaryCurrency,
      companyName: row.companyName,
      company: row.companyRef ? { id: row.companyRef.id, slug: row.companyRef.slug, name: row.companyRef.name, logo: row.companyRef.logo, verified: row.companyRef.verified } : null,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      tags: row.tags,
      easyApply: row.easyApply,
      visibility: row.visibility,
    };
  });
  return NextResponse.json({ company: { id: company.id, name: company.name, slug: company.slug }, jobs: data });
}
