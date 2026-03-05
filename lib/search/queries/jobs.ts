/**
 * Typesense job search: searchJobs with params, filter_by, facets.
 */

import { typesenseClient } from "../client";
import { JOBS_COLLECTION, type TypesenseJobDocument } from "../schemas/jobs";

export interface JobSearchParams {
  q?: string;
  page?: number;
  limit?: number;
  location?: string;
  jobType?: string[];
  workMode?: string[];
  skills?: string[];
  experienceMin?: number;
  experienceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  includeNotDisclosed?: boolean;
  datePosted?: "24h" | "7d" | "30d";
  easyApplyOnly?: boolean;
  companySlug?: string;
  minRating?: number;
  sort?: "recent" | "salary" | "relevance";
  verifiedOnly?: boolean;
}

export interface FacetCounts {
  companyName?: { value: string; count: number }[];
  location?: { value: string; count: number }[];
  workMode?: { value: string; count: number }[];
  jobType?: { value: string; count: number }[];
  skills?: { value: string; count: number }[];
  educationLevel?: { value: string; count: number }[];
  tags?: { value: string; count: number }[];
  status?: { value: string; count: number }[];
  easyApply?: { value: string; count: number }[];
  companyVerified?: { value: string; count: number }[];
}

export interface JobSearchResult {
  hits: TypesenseJobDocument[];
  found: number;
  facets: FacetCounts;
  page: number;
  totalPages: number;
}

function buildFilterBy(params: JobSearchParams): string {
  const parts: string[] = ['status:=ACTIVE'];
  if (params.location) parts.push(`location:=[${params.location}]`);
  if (params.jobType?.length) parts.push(`jobType:=[${params.jobType.join(",")}]`);
  if (params.workMode?.length) parts.push(`workMode:=[${params.workMode.join(",")}]`);
  if (params.skills?.length) parts.push(`skills:=[${params.skills.join(",")}]`);
  if (params.experienceMin != null) parts.push(`experienceMax:>=${params.experienceMin}`);
  if (params.experienceMax != null) parts.push(`experienceMin:<=${params.experienceMax}`);
  if (params.salaryMin != null) parts.push(`salaryMax:>=${params.salaryMin}`);
  if (params.salaryMax != null) parts.push(`salaryMin:<=${params.salaryMax}`);
  if (params.includeNotDisclosed !== true && (params.salaryMin != null || params.salaryMax != null)) parts.push("salaryVisible:=true");
  if (params.easyApplyOnly) parts.push("easyApply:=true");
  if (params.companySlug) parts.push(`companySlug:=${params.companySlug}`);
  if (params.minRating != null) parts.push(`companyRating:>=${params.minRating}`);
  if (params.verifiedOnly) parts.push("companyVerified:=true");
  if (params.datePosted) {
    const now = Math.floor(Date.now() / 1000);
    const sec = params.datePosted === "24h" ? 86400 : params.datePosted === "7d" ? 604800 : 2592000;
    parts.push(`publishedAt:>=${now - sec}`);
  }
  return parts.join(" && ");
}

function buildSortBy(sort?: "recent" | "salary" | "relevance"): string {
  if (sort === "salary") return "salaryMax:desc";
  if (sort === "relevance") return "_text_match:desc";
  return "publishedAt:desc";
}

export async function searchJobs(params: JobSearchParams): Promise<JobSearchResult> {
  const client = typesenseClient;
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(50, Math.max(1, params.limit ?? 20));
  const filterBy = buildFilterBy(params);
  const sortBy = buildSortBy(params.sort);
  const q = params.q && params.q.trim().length > 0 ? params.q.trim() : "*";
  const searchParams = {
    q,
    query_by: "title,description,companyName,skills,tags",
    filter_by: filterBy,
    sort_by: sortBy,
    facet_by: "companyName,location,workMode,jobType,skills,educationLevel,tags,status,easyApply,companyVerified",
    max_facet_values: 20,
    page,
    per_page: limit,
  };
  const res = await client
    .collections(JOBS_COLLECTION)
    .documents()
    .search(searchParams);
  const hits = (res.hits ?? []).map((h) => h.document as TypesenseJobDocument);
  const found = res.found ?? 0;
  const totalPages = Math.ceil(found / limit) || 1;
  const facets: FacetCounts = {};
  for (const fc of res.facet_counts ?? []) {
    const name = fc.field_name as keyof FacetCounts;
    facets[name] = (fc.counts ?? []).map((c: { value: string; count: number }) => ({ value: c.value, count: c.count }));
  }
  return { hits, found, facets, page, totalPages };
}
