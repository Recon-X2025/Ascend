import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { canUseFeature } from "@/lib/payments/gate";
import { getCompanySalaries } from "@/lib/salary/aggregate";
import { prisma } from "@/lib/prisma/client";
import { buildMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/layout/Container";
import { formatSalaryLPA } from "@/lib/salary/format";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ role?: string; city?: string; year?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await prisma.company.findUnique({
    where: { slug },
    select: { name: true, slug: true },
  });
  if (!company)
    return buildMetadata({ title: "Company Not Found", path: "/salary", noIndex: true });
  return buildMetadata({
    title: `${company.name} — Salary by Role`,
    description: `Salary data at ${company.name}: median CTC by role. Compare with market.`,
    path: `/salary/companies/${company.slug}`,
  });
}

export default async function CompanySalaryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { role: roleFilter, city, year: yearParam } = await searchParams;
  const year = yearParam ? parseInt(yearParam, 10) : undefined;

  const company = await prisma.company.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, logo: true },
  });
  if (!company) notFound();

  const [session, roles] = await Promise.all([
    getServerSession(authOptions),
    getCompanySalaries(company.id, { role: roleFilter ?? undefined, city: city ?? undefined, year }),
  ]);

  const userId = (session?.user as { id?: string } | undefined)?.id ?? "";
  const { allowed: percentilesAllowed } = await canUseFeature(userId, "salary_percentiles");

  return (
    <div className="bg-bg min-h-screen">
      <Container className="py-8">
        <div className="mb-6">
          <Link href="/salary" className="text-sm text-green-dark hover:underline">
            ← Salary Insights
          </Link>
        </div>

        <header className="flex items-center gap-4 mb-8">
          {company.logo && (
            <Image
              src={company.logo}
              alt=""
              width={48}
              height={48}
              className="rounded-lg object-contain bg-surface border border-border"
            />
          )}
          <div>
            <h1 className="text-2xl font-display font-semibold text-ink">{company.name}</h1>
            <Link
              href={`/companies/${company.slug}`}
              className="text-sm text-green-dark hover:underline"
            >
              View company profile
            </Link>
          </div>
        </header>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-4">Salary by role</h2>
          {roles.length === 0 ? (
            <p className="text-ink-3">
              Not enough data yet. Be the first to add your salary →
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-2 text-left text-ink-3">
                    <th className="py-3 px-4 font-medium">Role</th>
                    <th className="py-3 px-4 font-medium text-right">Median CTC</th>
                    {percentilesAllowed && (
                      <>
                        <th className="py-3 px-4 font-medium text-right">P25</th>
                        <th className="py-3 px-4 font-medium text-right">P75</th>
                      </>
                    )}
                    <th className="py-3 px-4 font-medium text-right">Submissions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((r) => (
                    <tr key={r.jobTitle} className="border-b border-border/50">
                      <td className="py-3 px-4 text-ink-2">{r.jobTitle}</td>
                      <td className="py-3 px-4 text-right font-medium text-green-dark">
                        {formatSalaryLPA(r.median)}
                      </td>
                      {percentilesAllowed && (
                        <>
                          <td className="py-3 px-4 text-right text-ink-3">
                            {r.p25 != null ? formatSalaryLPA(r.p25) : "—"}
                          </td>
                          <td className="py-3 px-4 text-right text-ink-3">
                            {r.p75 != null ? formatSalaryLPA(r.p75) : "—"}
                          </td>
                        </>
                      )}
                      <td className="py-3 px-4 text-right text-ink-3">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-8 rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-sm text-ink-2">Work here? Add your salary to help others.</p>
          <Link
            href={`/reviews/salary/new?companyId=${company.id}`}
            className="inline-block mt-2"
          >
            <Button variant="outline" size="sm">
              Add your salary
            </Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}
