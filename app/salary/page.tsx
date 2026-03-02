import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/layout/Container";
import { RoleSearchBar } from "@/components/salary/RoleSearchBar";
import { TrendingRolesStrip } from "@/components/salary/TrendingRolesStrip";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/growth/ShareButton";

export const metadata: Metadata = buildMetadata({
  title: "Salary Insights in India — Compare by Role & City",
  description:
    "Compare salaries for thousands of roles across India. See median pay, percentiles, and how your salary stacks up in Bangalore, Mumbai, Delhi, and more.",
  path: "/salary",
});

const CATEGORIES = [
  { label: "Engineering", slug: "engineering" },
  { label: "Product", slug: "product" },
  { label: "Design", slug: "design" },
  { label: "Data", slug: "data" },
  { label: "Marketing", slug: "marketing" },
  { label: "Finance", slug: "finance" },
  { label: "Operations", slug: "operations" },
  { label: "HR", slug: "hr" },
  { label: "Sales", slug: "sales" },
];

export default function SalaryHubPage() {
  return (
    <div className="bg-bg min-h-screen">
      <Container className="py-12 md:py-16">
        <section className="text-center max-w-2xl mx-auto mb-12 relative">
          <div className="absolute top-0 right-0">
            <ShareButton
              entityType="SALARY_INSIGHT"
              entityId="salary"
              url="/salary"
              title="Salary Insights — Ascend"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-semibold text-ink">
            Know your worth. Before you negotiate.
          </h1>
          <p className="mt-3 text-ink-2">
            Salary data from professionals and job postings across India.
          </p>
          <div className="mt-6">
            <RoleSearchBar className="justify-center" />
          </div>
        </section>

        <section className="mb-12">
          <TrendingRolesStrip />
        </section>

        <section className="mb-12">
          <h2 className="text-lg font-semibold text-ink mb-4">Browse by category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/salary?role=${encodeURIComponent(cat.label)}`}
                className="rounded-xl border border-border bg-surface px-4 py-3 hover:border-green/50 hover:shadow-sm transition-all text-center font-medium text-ink-2 hover:text-green-dark"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl bg-surface-2 border border-border p-6 mb-12">
          <h2 className="text-lg font-semibold text-ink mb-3">How it works</h2>
          <ul className="space-y-2 text-sm text-ink-2">
            <li>
              <strong className="text-ink">Community data</strong> — Self-reported, anonymised salaries from professionals.
            </li>
            <li>
              <strong className="text-ink">Job posting data</strong> — Ranges extracted from live job postings.
            </li>
            <li>
              <strong className="text-ink">Privacy first</strong> — Individual salaries are never shown; only aggregates.
            </li>
          </ul>
        </section>

        <section className="rounded-xl border border-green/30 bg-green/5 p-6 text-center">
          <h2 className="text-lg font-semibold text-ink">Unlock full salary intelligence</h2>
          <p className="mt-2 text-sm text-ink-2">
            Percentile breakdowns, city comparison, top payers — upgrade to Premium.
          </p>
          <Link href="/dashboard/billing/upgrade" className="inline-block mt-4">
            <Button variant="primary">Upgrade to Premium</Button>
          </Link>
        </section>
      </Container>
    </div>
  );
}
