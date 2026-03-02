import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { canUseFeature } from "@/lib/payments/gate";
import { Container } from "@/components/layout/Container";
import { SalaryEstimatorWidget } from "@/components/salary/SalaryEstimatorWidget";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Salary Estimator — Estimate Your Pay by Role & City",
  description: "Get a salary estimate based on role, city, and experience. Powered by community and job-posting data.",
  path: "/salary/estimate",
});

export default async function SalaryEstimatePage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id ?? "";
  const { allowed } = await canUseFeature(userId, "salary_estimator_full");

  return (
    <div className="bg-bg min-h-screen">
      <Container className="py-8 max-w-lg">
        <div className="mb-6">
          <Link href="/salary" className="text-sm text-green-dark hover:underline">
            ← Salary Insights
          </Link>
        </div>

        <header className="mb-8">
          <h1 className="text-2xl font-display font-semibold text-ink">Salary estimator</h1>
          <p className="text-ink-2 mt-1 text-sm">
            Enter your role, city, and experience to get an estimate. Premium users see full range and confidence.
          </p>
        </header>

        <SalaryEstimatorWidget hasPremium={allowed} />
      </Container>
    </div>
  );
}
