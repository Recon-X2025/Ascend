import { BASE_URL } from "./metadata";

export interface JobPostingInput {
  id: number;
  title: string;
  slug: string;
  description: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  salaryPeriod?: string;
  locations: string[];
  workMode: string;
  type: string;
  postedAt: Date | null;
  deadline?: Date | null;
  company: { name: string; website?: string | null; logo?: string | null; slug?: string };
  skills: string[];
  experienceMin?: number | null;
  experienceMax?: number | null;
}

export function buildJobPostingSchema(job: JobPostingInput) {
  const employmentTypeMap: Record<string, string> = {
    FULL_TIME: "FULL_TIME",
    PART_TIME: "PART_TIME",
    CONTRACT: "CONTRACTOR",
    INTERNSHIP: "INTERN",
    TEMPORARY: "TEMPORARY",
    FREELANCE: "OTHER",
  };

  const workLocationMap: Record<string, string> = {
    REMOTE: "TELECOMMUTE",
    HYBRID: "HYBRID",
    ONSITE: "ONSITE",
    FLEXIBLE: "HYBRID",
  };

  const postedAt = job.postedAt ?? new Date();

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    identifier: {
      "@type": "PropertyValue",
      name: job.company.name,
      value: `ascend-job-${job.id}`,
    },
    datePosted: (postedAt instanceof Date ? postedAt : new Date(postedAt)).toISOString().split("T")[0],
    ...(job.deadline && {
      validThrough: (job.deadline instanceof Date ? job.deadline : new Date(job.deadline!)).toISOString().split("T")[0],
    }),
    employmentType: employmentTypeMap[job.type] ?? "OTHER",
    hiringOrganization: {
      "@type": "Organization",
      name: job.company.name,
      ...(job.company.website && { sameAs: job.company.website }),
      ...(job.company.logo && { logo: job.company.logo }),
    },
    jobLocation:
      job.workMode === "REMOTE"
        ? { "@type": "Place", address: { "@type": "PostalAddress", addressCountry: "IN" } }
        : job.locations.map((loc) => ({
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: loc,
              addressCountry: "IN",
            },
          })),
    ...(job.workMode === "REMOTE" && {
      applicantLocationRequirements: { "@type": "Country", name: "IN" },
    }),
    jobLocationType: workLocationMap[job.workMode] ?? "ONSITE",
    url: `${BASE_URL}/jobs/${job.slug}`,
    ...(job.salaryMin != null &&
      job.salaryMax != null && {
        baseSalary: {
          "@type": "MonetaryAmount",
          currency: job.salaryCurrency ?? "INR",
          value: {
            "@type": "QuantitativeValue",
            minValue: job.salaryMin,
            maxValue: job.salaryMax,
            unitText: job.salaryPeriod ?? "YEAR",
          },
        },
      }),
    skills: job.skills.join(", "),
    ...(job.experienceMin != null && {
      experienceRequirements: {
        "@type": "OccupationalExperienceRequirements",
        monthsOfExperience: job.experienceMin * 12,
      },
    }),
    directApply: true,
  };
}

export interface OrganizationInput {
  name: string;
  slug: string;
  description?: string | null;
  website?: string | null;
  logo?: string | null;
  founded?: number | null;
  size?: string | null;
  industry?: string | null;
  headquarters?: string | null;
  averageRating?: number | null;
  reviewCount?: number | null;
}

export function buildOrganizationSchema(company: OrganizationInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    url: `${BASE_URL}/companies/${company.slug}`,
    ...(company.logo && { logo: company.logo }),
    ...(company.website && { sameAs: company.website }),
    ...(company.description && { description: company.description }),
    ...(company.founded && { foundingDate: String(company.founded) }),
    ...(company.headquarters && {
      address: {
        "@type": "PostalAddress",
        addressLocality: company.headquarters,
      },
    }),
    ...(company.averageRating != null &&
      company.reviewCount != null &&
      company.reviewCount > 0 && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: company.averageRating.toFixed(1),
          reviewCount: company.reviewCount,
          bestRating: "5",
          worstRating: "1",
        },
      }),
  };
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Ascend",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/jobs?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
