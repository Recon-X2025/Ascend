import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { canUseFeature } from "@/lib/payments/gate";
import { getRoleSalary, getTopPayers, getCitySalaryComparison } from "@/lib/salary/aggregate";
import { prisma } from "@/lib/prisma/client";
import { buildMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/layout/Container";
import { SalaryOverviewCard } from "@/components/salary/SalaryOverviewCard";
import { PercentileBar } from "@/components/salary/PercentileBar";
import { CityComparisonTable } from "@/components/salary/CityComparisonTable";
import { TopPayersCard } from "@/components/salary/TopPayersCard";
import { SalaryEstimatorWidget } from "@/components/salary/SalaryEstimatorWidget";
import { PremiumGate } from "@/components/shared/PremiumGate";
import { DataSourceBadge } from "@/components/salary/DataSourceBadge";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ city?: string; year?: string }>;
}

function slugToRole(slug: string): string {
  return slug.replace(/-/g, " ").trim();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const role = slugToRole(slug);
  return buildMetadata({
    title: `${role} Salary in India — Median, Percentiles & Comparison`,
    description: `See ${role} salary data: median CTC, city breakdown, and how it compares. Community and job-posting data.`,
    path: `/salary/roles/${slug}`,
  });
}

export default async function RoleDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { city: cityParam, year: yearParam } = await searchParams;
  const role = slugToRole(slug);
  const year = yearParam ? parseInt(yearParam, 10) : undefined;

  const [session, salary] = await Promise.all([
    getServerSession(authOptions),
    getRoleSalary(role, cityParam ?? undefined, year ?? null),
  ]);

  if (!salary) notFound();

  const userId = (session?.user as { id?: string } | undefined)?.id ?? "";
  const [percentilesAllowed, topPayersAllowed, cityComparisonAllowed, estimatorFullAllowed] =
    await Promise.all([
      canUseFeature(userId, "salary_percentiles"),
      canUseFeature(userId, "salary_top_payers"),
      canUseFeature(userId, "salary_city_comparison"),
      canUseFeature(userId, "salary_estimator_full"),
    ]);

  const citiesFromReports = await prisma.salaryReport.findMany({
    where: {
      status: "APPROVED",
      jobTitle: { contains: role.toLowerCase(), mode: "insensitive" },
    },
    select: { location: true },
    distinct: ["location"],
  });
  const cityList = citiesFromReports.map((r) => r.location).filter(Boolean) as string[];
  const cityBreakdown = await Promise.all(
    cityList.slice(0, 20).map(async (c) => {
      const s = await getRoleSalary(role, c, year ?? null);
      return { city: c, median: s?.median ?? 0, count: s?.count ?? 0 };
    })
  );
  cityBreakdown.sort((a, b) => b.median - a.median);
  const filteredCityBreakdown = cityBreakdown.filter((r) => r.count > 0);

  const topPayers = topPayersAllowed.allowed ? await getTopPayers(role, cityParam ?? null, 10) : [];
  const cityComparison =
    cityComparisonAllowed.allowed && cityList.length > 0
      ? await getCitySalaryComparison(role, cityList.slice(0, 5))
      : [];

  return (
    <div className="bg-bg min-h-screen">
      <Container className="py-8">
        <div className="mb-6">
          <Link href="/salary" className="text-sm text-green-dark hover:underline">
            ← Salary Insights
          </Link>
        </div>

        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-display font-semibold text-ink capitalize">
            {role}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <DataSourceBadge sourceLabel={salary.sourceLabel} />
            {salary.submissionCount > 0 && (
              <span className="text-sm text-ink-3">{salary.submissionCount} community reports</span>
            )}
            {salary.jdSignalCount > 0 && (
              <span className="text-sm text-ink-3">{salary.jdSignalCount} job postings</span>
            )}
            <span className="text-sm text-ink-3">
              Last updated {new Date().toISOString().slice(0, 7).replace("-", "/")}
            </span>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <SalaryOverviewCard
              median={salary.median}
              sourceLabel={salary.sourceLabel}
              submissionCount={salary.submissionCount}
              jdSignalCount={salary.jdSignalCount}
              cityBreakdown={filteredCityBreakdown}
            />

            {salary.p25 != null && salary.p75 != null && salary.p90 != null && (
              <section>
                <h2 className="text-lg font-semibold text-ink mb-3">Percentile distribution</h2>
                <PremiumGate
                  feature="salary_percentiles"
                  allowed={percentilesAllowed.allowed}
                >
                  <PercentileBar
                    p25={salary.p25}
                    median={salary.median}
                    p75={salary.p75}
                    p90={salary.p90}
                  />
                </PremiumGate>
              </section>
            )}

            {cityComparison.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-ink mb-3">City cost-of-living comparison</h2>
                <PremiumGate
                  feature="salary_city_comparison"
                  allowed={cityComparisonAllowed.allowed}
                >
                  <CityComparisonTable rows={cityComparison} />
                </PremiumGate>
              </section>
            )}

            {topPayers.length > 0 && (
              <section>
                <PremiumGate feature="salary_top_payers" allowed={topPayersAllowed.allowed}>
                  <TopPayersCard topPayers={topPayers} />
                </PremiumGate>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <SalaryEstimatorWidget
              defaultRole={role}
              hasPremium={estimatorFullAllowed.allowed}
            />
            <div className="rounded-xl border border-border bg-surface p-4 text-center">
              <p className="text-sm text-ink-2">Is this data accurate for your experience?</p>
              <Link
                href="/salary"
                className="inline-block mt-2"
              >
                <Button variant="outline" size="sm">
                  Add your salary →
                </Button>
              </Link>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}
