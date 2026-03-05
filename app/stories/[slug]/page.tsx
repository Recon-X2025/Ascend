import { notFound } from "next/navigation";
import { getSuccessStoryBySlug } from "@/lib/mentorship/success-stories";
import { SuccessStoryCard } from "@/components/mentorship/SuccessStoryCard";

export default async function SuccessStoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ utm_source?: string; utm_medium?: string }>;
}) {
  const { slug } = await params;
  const { utm_source, utm_medium } = await searchParams;

  const story = await getSuccessStoryBySlug(slug);
  if (!story) notFound();

  return (
    <div className="min-h-screen bg-[#F7F6F1] flex items-center justify-center p-4">
      <SuccessStoryCard
        story={story}
        utmParams={{ utm_source, utm_medium }}
      />
    </div>
  );
}
