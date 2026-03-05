import { notFound } from "next/navigation";
import { getCohortBySlug } from "@/lib/cohorts";
import { CohortClient } from "./CohortClient";

export default async function CohortPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cohort = await getCohortBySlug(slug);
  if (!cohort) notFound();
  return (
    <div className="min-h-screen bg-[#F7F6F1] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <CohortClient
          cohort={{
            id: cohort.id,
            name: cohort.name,
            slug: cohort.slug,
            transitionPath: cohort.transitionPath,
            description: cohort.description,
            memberCount: cohort._count.members,
            threadCount: cohort._count.threads,
          }}
        />
      </div>
    </div>
  );
}
