import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { trackOutcome } from "@/lib/tracking/outcomes";

export default async function CareersPage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    include: {
      careersPageConfig: true,
      jobPosts: {
        where: { status: "ACTIVE", visibility: "PUBLIC" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!company) notFound();

  const config = company.careersPageConfig;
  const jobs = company.jobPosts;

  if (Math.random() < 0.1) {
    const admin = await prisma.companyAdmin.findFirst({
      where: { companyId: company.id },
      select: { userId: true },
    });
    if (admin) {
      trackOutcome(admin.userId, "PHASE18_CAREERS_PAGE_VIEWED", {
        metadata: { companySlug, companyId: company.id },
      }).catch(() => {});
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Container className="py-12">
        <header className="mb-12">
          {config?.logoUrl && (
            <Image
              src={config.logoUrl}
              alt={company.name}
              width={48}
              height={48}
              className="h-12 w-auto object-contain mb-6"
              unoptimized
            />
          )}
          <h1 className="text-3xl font-display font-bold text-ink">
            {config?.heroTitle ?? `Careers at ${company.name}`}
          </h1>
          {config?.heroSubtitle && (
            <p className="mt-2 text-lg text-ink-2">{config.heroSubtitle}</p>
          )}
        </header>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-4">Open positions</h2>
          {jobs.length === 0 ? (
            <p className="text-ink-3">No open positions at the moment.</p>
          ) : (
            <ul className="space-y-4">
              {jobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.slug}`}
                    className="block p-4 rounded-lg border border-border bg-surface hover:border-green transition-colors"
                  >
                    <span className="font-medium text-ink">{job.title}</span>
                    {job.locations?.length > 0 && (
                      <span className="ml-2 text-sm text-ink-3">
                        — {job.locations.join(", ")}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="mt-16 pt-8 border-t border-border">
          {!config?.hideAscendBranding && (
            <p className="text-sm text-ink-4">
              Powered by{" "}
              <Link href="/" className="text-green hover:underline">
                Ascend
              </Link>
            </p>
          )}
        </footer>
      </Container>
    </div>
  );
}
