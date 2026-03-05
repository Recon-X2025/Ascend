import { notFound } from "next/navigation";
import { getMilestoneBySlug } from "@/lib/milestones/career";
import { MilestoneCard } from "@/components/milestones/MilestoneCard";

export default async function MilestonePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ utm_source?: string; utm_medium?: string }>;
}) {
  const { slug } = await params;
  const { utm_source, utm_medium } = await searchParams;

  const data = await getMilestoneBySlug(slug);
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-[#F7F6F1] flex items-center justify-center p-4">
      <MilestoneCard
        data={data}
        utmParams={{ utm_source, utm_medium }}
      />
    </div>
  );
}
