/**
 * Server-side company queries for pages (SEO).
 */

import { prisma } from "@/lib/prisma/client";
import { getCompanyRatingAggregate } from "@/lib/companies/ratings";
import type { CompanyRatingAggregate } from "@/lib/companies/ratings";

export interface CompanyForPage {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
  banner: string | null;
  industry: string | null;
  type: string | null;
  size: string | null;
  founded: number | null;
  hq: string | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  glassdoor: string | null;
  mission: string | null;
  about: string | null;
  specialties: string[];
  verified: boolean;
  claimed: boolean;
  media: { id: string; type: string; url: string; caption: string | null; order: number }[];
  benefits: { id: string; label: string; icon: string | null; order: number; avgRating: number | null }[];
  ratingAggregate: CompanyRatingAggregate | null;
}

export async function getCompanyBySlugForPage(slug: string): Promise<CompanyForPage | null> {
  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      media: { orderBy: { order: "asc" } },
      benefits: { orderBy: { order: "asc" }, include: { ratings: { select: { rating: true } } } },
    },
  });
  if (!company) return null;

  const ratingAgg = await getCompanyRatingAggregate(company.id);
  const benefits = company.benefits.map((b) => {
    const ratings = b.ratings.map((r) => r.rating);
    const avg = ratings.length ? ratings.reduce((a, n) => a + n, 0) / ratings.length : null;
    return {
      id: b.id,
      label: b.label,
      icon: b.icon,
      order: b.order,
      avgRating: avg != null ? Math.round(avg * 10) / 10 : null,
    };
  });

  return {
    id: company.id,
    slug: company.slug,
    name: company.name,
    logo: company.logo,
    banner: company.banner,
    industry: company.industry,
    type: company.type,
    size: company.size,
    founded: company.founded,
    hq: company.hq,
    website: company.website,
    linkedin: company.linkedin,
    twitter: company.twitter,
    glassdoor: company.glassdoor,
    mission: company.mission,
    about: company.about,
    specialties: company.specialties,
    verified: company.verified,
    claimed: company.claimed,
    media: company.media.map((m) => ({
      id: m.id,
      type: m.type,
      url: m.url,
      caption: m.caption,
      order: m.order,
    })),
    benefits,
    ratingAggregate: ratingAgg,
  };
}
