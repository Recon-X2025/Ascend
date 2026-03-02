import { Suspense } from "react";
import type { Metadata } from "next";
import { JobsListing } from "@/components/jobs/JobsListing";
import { Container } from "@/components/layout/Container";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const q = typeof params.search === "string" ? params.search : typeof params.q === "string" ? params.q : "";
  const location = typeof params.location === "string" ? params.location : "";

  if (q && location) {
    return buildMetadata({
      title: `${q} Jobs in ${location}`,
      description: `Browse ${q} jobs in ${location}. Filter by salary, work mode, experience, and company rating on Ascend.`,
      path: `/jobs?search=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}`,
    });
  }

  if (q) {
    return buildMetadata({
      title: `${q} Jobs in India`,
      description: `Find the best ${q} jobs in India. Apply with your Ascend profile — see your fit score before you apply.`,
      path: `/jobs?search=${encodeURIComponent(q)}`,
    });
  }

  return buildMetadata({
    title: "Jobs in India — Search & Apply",
    description:
      "Browse thousands of jobs across India. See your fit score for every role, optimise your resume, and apply in one click on Ascend.",
    path: "/jobs",
  });
}

export default function JobsPage() {
  return (
    <Container className="py-8">
      <h1 className="text-2xl font-semibold text-foreground">Jobs</h1>
      <p className="mt-1 text-muted-foreground">Find your next role.</p>
      <Suspense fallback={<div className="mt-6 text-muted-foreground">Loading…</div>}>
        <JobsListing />
      </Suspense>
    </Container>
  );
}
