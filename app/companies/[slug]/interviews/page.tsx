import { notFound } from "next/navigation";
import { getCompanyBySlugForPage } from "@/lib/companies/queries";
import { CompanyHero } from "@/components/company/CompanyHero";
import { CompanyTabs } from "@/components/company/CompanyTabs";
import { ReviewsTab } from "../components/ReviewsTab";

export default async function CompanyInterviewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getCompanyBySlugForPage(slug);
  if (!company) notFound();
  return (
    <div className="page-container py-6">
      <CompanyHero slug={company.slug} name={company.name} logo={company.logo} banner={company.banner} industry={company.industry} type={company.type} size={company.size} verified={company.verified} claimed={company.claimed} />
      <CompanyTabs slug={company.slug} />
      <ReviewsTab companyId={company.id} companySlug={company.slug} initialSubTab="interview" />
    </div>
  );
}
