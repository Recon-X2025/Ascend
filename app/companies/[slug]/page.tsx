import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCompanyBySlugForPage } from "@/lib/companies/queries";
import { buildMetadata } from "@/lib/seo/metadata";
import { BASE_URL } from "@/lib/seo/metadata";
import { buildOrganizationSchema, buildBreadcrumbSchema } from "@/lib/seo/schemas";
import { JsonLd } from "@/components/seo/JsonLd";
import { CompanyHero } from "@/components/company/CompanyHero";
import { CompanyTabs } from "@/components/company/CompanyTabs";
import { ShareButton } from "@/components/growth/ShareButton";
import { CompanyOverview } from "@/components/company/CompanyOverview";
import { CompanyInsightsCard } from "@/components/company/CompanyInsightsCard";
import { prisma } from "@/lib/prisma/client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await prisma.company.findUnique({
    where: { slug },
    select: { name: true, slug: true, industry: true, hq: true, id: true },
  });

  if (!company)
    return buildMetadata({ title: "Company Not Found", path: "/companies", noIndex: true });

  const jobCount = await prisma.jobPost.count({
    where: { companyId: company.id, status: "ACTIVE" },
  });

  return buildMetadata({
    title: `${company.name} — Jobs, Reviews & Salaries`,
    description: `${company.name} jobs, employee reviews, interview experiences, and salary data on Ascend. ${jobCount} open role${jobCount === 1 ? "" : "s"}.`,
    path: `/companies/${company.slug}`,
  });
}

export default async function CompanyPage({ params }: PageProps) {
  const { slug } = await params;
  const company = await getCompanyBySlugForPage(slug);
  if (!company) notFound();

  const insightByRelation = await prisma.company.findUnique({
    where: { slug },
    select: { insight: true, industry: true, hq: true },
  });
  let insight =
    insightByRelation?.insight ??
    (await prisma.companyInsight.findFirst({
      where: { companyName: { equals: company.name, mode: "insensitive" } },
    }));
  if (!insight && insightByRelation?.industry && insightByRelation?.hq) {
    const key = `${insightByRelation.industry}::${insightByRelation.hq}`;
    insight = (await prisma.companyInsight.findUnique({
      where: { industryLocation: key },
    })) ?? null;
  }

  const orgSchema = buildOrganizationSchema({
    name: company.name,
    slug: company.slug,
    description: company.about ?? company.mission ?? null,
    website: company.website,
    logo: company.logo,
    founded: company.founded,
    size: company.size,
    industry: company.industry,
    headquarters: company.hq,
    averageRating: company.ratingAggregate?.overallAvg ?? null,
    reviewCount: company.ratingAggregate?.reviewCount ?? null,
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: BASE_URL },
    { name: "Companies", url: `${BASE_URL}/companies` },
    { name: company.name, url: `${BASE_URL}/companies/${company.slug}` },
  ]);

  return (
    <>
      <JsonLd schema={orgSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <div className="page-container py-6">
      <CompanyHero
        slug={company.slug}
        name={company.name}
        logo={company.logo}
        banner={company.banner}
        industry={company.industry}
        type={company.type}
        size={company.size}
        verified={company.verified}
        claimed={company.claimed}
      />
      <div className="flex justify-end mt-2">
        <ShareButton
          entityType="COMPANY"
          entityId={company.slug}
          url={`${BASE_URL}/companies/${company.slug}`}
          title={`${company.name} — Jobs & Reviews`}
        />
      </div>
      <CompanyTabs slug={company.slug} />
      {insight && (
        <section className="mt-6">
          <CompanyInsightsCard
            insight={{
              totalJDsIndexed: insight.totalJDsIndexed,
              activeRoleCount: insight.activeRoleCount,
              topRoles: (insight.topRoles as { title: string; count: number; seniority: string | null }[]) ?? [],
              topSkills: (insight.topSkills as { skill: string; count: number }[]) ?? [],
              topLocations: (insight.topLocations as { city: string; count: number }[]) ?? [],
              primaryLocation: insight.primaryLocation,
              salaryMin: insight.salaryMin,
              salaryMax: insight.salaryMax,
              salaryMedian: insight.salaryMedian,
              salaryDisclosureRate: insight.salaryDisclosureRate,
              juniorPct: insight.juniorPct,
              midPct: insight.midPct,
              seniorPct: insight.seniorPct,
              managerPct: insight.managerPct,
              hiringVelocity: insight.hiringVelocity,
              industries: (insight.industries as { industry: string; count: number }[]) ?? [],
              lastComputedAt: insight.lastComputedAt.toISOString(),
            }}
          />
        </section>
      )}
      <CompanyOverview company={company} />
      </div>
    </>
  );
}
