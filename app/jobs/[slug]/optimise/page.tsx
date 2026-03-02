import { notFound } from "next/navigation";
import Link from "next/link";
import { getJobBySlug } from "@/lib/jobs/queries";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function JobOptimisePage({ params }: PageProps) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) notFound();

  return (
    <div className="page-container py-8">
      <h1 className="text-xl font-semibold">Optimise resume for this job</h1>
      <p className="text-muted-foreground mt-2">
        Phase 6A will add the JD Optimiser here. For now, use the resume builder to tailor your resume manually.
      </p>
      <Button asChild className="mt-4">
        <Link href={`/jobs/${slug}`}>Back to job</Link>
      </Button>
    </div>
  );
}
