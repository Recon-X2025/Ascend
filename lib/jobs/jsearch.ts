const RAPIDAPI_HOST = "jsearch.p.rapidapi.com";

export interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo?: string;
  job_description: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_posted_at_datetime_utc?: string;
  job_apply_link: string;
  job_employment_type?: string;
  job_is_remote?: boolean;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_currency?: string;
  job_salary_period?: string;
  job_required_skills?: string[];
  job_required_experience?: {
    required_experience_in_months?: number;
    no_experience_required?: boolean;
  };
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  };
}

export interface JSearchResponse {
  status: string;
  request_id?: string;
  data: JSearchJob[];
  parameters?: {
    num_pages?: number;
    query?: string;
    page?: number;
  };
}

export async function searchJobs(params: {
  query: string;
  location?: string;
  page?: number;
  num_results?: number;
  country?: string;
  remote_jobs_only?: boolean;
  employment_types?: string;
  date_posted?: "all" | "today" | "3days" | "week" | "month";
}): Promise<JSearchResponse> {
  if (!process.env.RAPIDAPI_KEY) {
    throw new Error("RAPIDAPI_KEY is not set");
  }

  const url = new URL("https://jsearch.p.rapidapi.com/search");
  url.searchParams.set("query", params.query);
  if (params.location) url.searchParams.set("location", params.location);
  url.searchParams.set("page", String(params.page || 1));
  url.searchParams.set("num_results", String(params.num_results || 10));
  if (params.country) url.searchParams.set("country", params.country);
  if (params.remote_jobs_only)
    url.searchParams.set("remote_jobs_only", "true");
  if (params.employment_types)
    url.searchParams.set("employment_types", params.employment_types);
  if (params.date_posted)
    url.searchParams.set("date_posted", params.date_posted);

  const res = await fetch(url.toString(), {
    headers: {
      "x-rapidapi-host": RAPIDAPI_HOST,
      "x-rapidapi-key": process.env.RAPIDAPI_KEY,
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`JSearch API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<JSearchResponse>;
}
