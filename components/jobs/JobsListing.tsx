"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { JobCard } from "./JobCard";
import { JobCardSkeleton } from "./JobCardSkeleton";
import { JobFilters } from "./JobFilters";
import type { JobFiltersState, FacetCounts } from "./JobFilters";
import { SearchBar } from "./SearchBar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";

const defaultFilters: JobFiltersState = {
  search: "",
  location: "",
  jobType: [],
  workMode: [],
  skills: [],
  experienceMin: "",
  experienceMax: "",
  salaryMin: "",
  salaryMax: "",
  includeNotDisclosed: false,
  datePosted: "",
  easyApplyOnly: false,
  minRating: 0,
  verifiedOnly: false,
};

function parseParams(searchParams: URLSearchParams): JobFiltersState & { sort: "recent" | "salary" | "relevance"; page: number } {
  const get = (k: string) => searchParams.get(k) ?? "";
  const getList = (k: string) => (searchParams.get(k) || "").split(",").filter(Boolean);
  return {
    ...defaultFilters,
    search: get("search"),
    location: get("location"),
    jobType: getList("jobType"),
    workMode: getList("workMode"),
    skills: getList("skills"),
    experienceMin: get("experienceMin"),
    experienceMax: get("experienceMax"),
    salaryMin: get("salaryMin"),
    salaryMax: get("salaryMax"),
    includeNotDisclosed: searchParams.get("includeNotDisclosed") === "true",
    datePosted: get("datePosted"),
    easyApplyOnly: searchParams.get("easyApplyOnly") === "true",
    minRating: parseFloat(get("minRating")) || 0,
    verifiedOnly: searchParams.get("verifiedOnly") === "true",
    sort: (searchParams.get("sort") === "salary" ? "salary" : searchParams.get("sort") === "relevance" ? "relevance" : "recent") as "recent" | "salary" | "relevance",
    page: Math.max(1, parseInt(get("page") || "1", 10)),
  };
}

function buildParams(filters: JobFiltersState, sort: string, page: number): URLSearchParams {
  const p = new URLSearchParams();
  p.set("page", String(page));
  if (filters.search) p.set("search", filters.search);
  if (filters.location) p.set("location", filters.location);
  if (filters.jobType.length) p.set("jobType", filters.jobType.join(","));
  if (filters.workMode.length) p.set("workMode", filters.workMode.join(","));
  if (filters.skills.length) p.set("skills", filters.skills.join(","));
  if (filters.experienceMin) p.set("experienceMin", filters.experienceMin);
  if (filters.experienceMax) p.set("experienceMax", filters.experienceMax);
  if (filters.salaryMin) p.set("salaryMin", filters.salaryMin);
  if (filters.salaryMax) p.set("salaryMax", filters.salaryMax);
  if (filters.includeNotDisclosed) p.set("includeNotDisclosed", "true");
  if (filters.datePosted) p.set("datePosted", filters.datePosted);
  if (filters.easyApplyOnly) p.set("easyApplyOnly", "true");
  if (filters.minRating > 0) p.set("minRating", String(filters.minRating));
  if (filters.verifiedOnly) p.set("verifiedOnly", "true");
  p.set("sort", sort);
  return p;
}

function activeChips(filters: JobFiltersState): { key: string; label: string }[] {
  const chips: { key: string; label: string }[] = [];
  if (filters.search) chips.push({ key: "search", label: `"${filters.search}"` });
  if (filters.location) chips.push({ key: "location", label: filters.location });
  filters.jobType.forEach((t) => chips.push({ key: `jobType:${t}`, label: t.replace(/_/g, " ") }));
  filters.workMode.forEach((w) => chips.push({ key: `workMode:${w}`, label: w }));
  filters.skills.forEach((s) => chips.push({ key: `skill:${s}`, label: s }));
  if (filters.minRating > 0) chips.push({ key: "minRating", label: `${filters.minRating}+ rating` });
  if (filters.verifiedOnly) chips.push({ key: "verifiedOnly", label: "Verified only" });
  if (filters.datePosted) chips.push({ key: "datePosted", label: filters.datePosted === "24h" ? "24h" : filters.datePosted === "7d" ? "7 days" : "30 days" });
  if (filters.easyApplyOnly) chips.push({ key: "easyApplyOnly", label: "Easy Apply" });
  if (filters.includeNotDisclosed) chips.push({ key: "includeNotDisclosed", label: "Salary not disclosed" });
  return chips;
}

function removeChip(
  key: string,
  filters: JobFiltersState,
  onChange: (next: Partial<JobFiltersState>) => void
) {
  if (key === "search") onChange({ search: "" });
  else if (key === "location") onChange({ location: "" });
  else if (key.startsWith("jobType:")) onChange({ jobType: filters.jobType.filter((t) => t !== key.slice(8)) });
  else if (key.startsWith("workMode:")) onChange({ workMode: filters.workMode.filter((w) => w !== key.slice(9)) });
  else if (key.startsWith("skill:")) onChange({ skills: filters.skills.filter((s) => s !== key.slice(6)) });
  else if (key === "minRating") onChange({ minRating: 0 });
  else if (key === "verifiedOnly") onChange({ verifiedOnly: false });
  else if (key === "datePosted") onChange({ datePosted: "" });
  else if (key === "easyApplyOnly") onChange({ easyApplyOnly: false });
  else if (key === "includeNotDisclosed") onChange({ includeNotDisclosed: false });
}

export function JobsListing() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<Parameters<typeof JobCard>[0]["job"][]>([]);
  const [found, setFound] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [facets, setFacets] = useState<FacetCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [suggestions, setSuggestions] = useState<{ titles: string[]; companies: string[] }>({ titles: [], companies: [] });
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<{ query: string; summary?: string }[]>([]);
  const [savedSearches, setSavedSearches] = useState<{ id: string; name: string; query: string; filters: unknown }[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [fitScoresMap, setFitScoresMap] = useState<Record<number, number>>({});
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const parsed = parseParams(searchParams);
  const [filters, setFilters] = useState<JobFiltersState>(parsed);
  const [sort, setSort] = useState<"recent" | "salary" | "relevance">(parsed.sort);
  const [page, setPage] = useState(parsed.page);

  const syncFromUrl = useCallback(() => {
    const p = parseParams(searchParams);
    setFilters(p);
    setSort(p.sort);
    setPage(p.page);
  }, [searchParams]);

  useEffect(() => {
    syncFromUrl();
  }, [syncFromUrl]);

  const pushUrl = useCallback(
    (next: Partial<JobFiltersState> & { sort?: "recent" | "salary" | "relevance"; page?: number }) => {
      const f = { ...filters, ...next };
      const s = next.sort ?? sort;
      const pg = next.page ?? (next.sort ? 1 : page);
      router.push("/jobs?" + buildParams(f, s, pg).toString(), { scroll: false });
      setFilters(f);
      setSort(s);
      setPage(pg);
    },
    [filters, sort, page, router]
  );

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch("/api/jobs?" + buildParams(filters, sort, page).toString())
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setJobs(j.data ?? []);
          setFound(j.found ?? 0);
          setTotalPages(j.totalPages ?? 0);
          setFacets(j.facets ?? null);
          if (filters.search.trim()) {
            fetch("/api/search/history", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query: filters.search.trim(), filters }),
            }).catch(() => {});
          }
        } else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [filters, sort, page]);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => setIsAuthenticated(!!s?.user));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch("/api/search/history")
      .then((r) => r.json())
      .then((j) => {
        if (j.success && Array.isArray(j.data)) {
          setRecentSearches(j.data.map((d: { query: string; summary?: string }) => ({
            query: d.query,
            summary: d.summary,
          })));
        }
      })
      .catch(() => {});
    fetch("/api/search/saved")
      .then((r) => r.json())
      .then((j) => {
        if (j.success && Array.isArray(j.data)) {
          setSavedSearches(j.data.map((d: { id: string; name: string; query: string; filters: unknown }) => ({
            id: d.id,
            name: d.name,
            query: d.query,
            filters: d.filters,
          })));
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || jobs.length === 0) {
      setFitScoresMap({});
      return;
    }
    const ids = jobs.slice(0, 20).map((j) => j.id);
    fetch("/api/jobs/fit-scores?jobIds=" + ids.join(","))
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object" && !data.error) {
          const next: Record<number, number> = {};
          for (const [k, v] of Object.entries(data)) {
            const id = parseInt(k, 10);
            if (!Number.isNaN(id) && v && typeof v === "object" && typeof (v as { overallScore?: number }).overallScore === "number") {
              next[id] = (v as { overallScore: number }).overallScore;
            }
          }
          setFitScoresMap(next);
        }
      })
      .catch(() => {});
  }, [isAuthenticated, jobs]);

  const fetchSuggestions = useCallback((q: string) => {
    if (q.trim().length < 2) {
      setSuggestions({ titles: [], companies: [] });
      return;
    }
    setLoadingSuggestions(true);
    fetch("/api/jobs/suggestions?q=" + encodeURIComponent(q))
      .then((r) => r.json())
      .then((j) => setSuggestions({ titles: j.titles ?? [], companies: j.companies ?? [] }))
      .catch(() => setSuggestions({ titles: [], companies: [] }))
      .finally(() => setLoadingSuggestions(false));
  }, []);

  useEffect(() => {
    if (filters.search.trim().length >= 2) fetchSuggestions(filters.search);
    else setSuggestions({ titles: [], companies: [] });
  }, [filters.search, fetchSuggestions]);

  const handleFilterChange = (next: Partial<JobFiltersState>) => {
    pushUrl({ ...next, page: 1 });
  };
  const clearFilters = () => {
    pushUrl({ ...defaultFilters, page: 1 });
  };

  const chips = activeChips(filters);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <SearchBar
          value={filters.search}
          onChange={(v) => handleFilterChange({ search: v })}
          onSearch={() => {}}
          suggestions={suggestions}
          onSelectSuggestion={(_, value) => handleFilterChange({ search: value })}
          recentSearches={recentSearches}
          onSelectRecent={(q) => handleFilterChange({ search: q })}
          onClearHistory={async () => {
            await fetch("/api/search/history", { method: "DELETE" });
            setRecentSearches([]);
          }}
          onDeleteHistoryItem={async (q) => {
            await fetch("/api/search/history?query=" + encodeURIComponent(q), { method: "DELETE" });
            setRecentSearches((prev) => prev.filter((r) => r.query !== q));
          }}
          showSaveSearch={isAuthenticated}
          onSaveSearch={async () => {
            await fetch("/api/search/saved", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: filters.search || "My search", query: filters.search, filters: filters }),
            });
          }}
          loadingSuggestions={loadingSuggestions}
        />
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mobile: Filters button + bottom sheet */}
        <div className="lg:hidden">
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="default"
                className="flex items-center gap-2 min-h-[44px] w-full sm:w-auto"
                aria-label="Open filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {chips.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                    {chips.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Filter Jobs</SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto h-[calc(85vh-8rem)] pb-4">
                <JobFilters
                  state={filters}
                  facets={facets}
                  onChange={handleFilterChange}
                  onClear={clearFilters}
                  showCompanyRating={!searchParams.get("companySlug")}
                  savedSearches={savedSearches}
                  onApplySavedSearch={(query, f) => {
                    pushUrl({ ...f, search: query, page: 1 });
                    setFilterSheetOpen(false);
                  }}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border rounded-t-2xl">
                <Button
                  className="w-full min-h-[44px]"
                  onClick={() => setFilterSheetOpen(false)}
                >
                  Show results
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop: sidebar */}
        <aside className="hidden lg:block lg:w-64 shrink-0">
          <div className="ascend-card p-4 sticky top-4">
            <h3 className="font-medium text-sm mb-3">Filters</h3>
            <JobFilters
              state={filters}
              facets={facets}
              onChange={handleFilterChange}
              onClear={clearFilters}
              showCompanyRating={!searchParams.get("companySlug")}
              savedSearches={savedSearches}
              onApplySavedSearch={(query, f) => pushUrl({ ...f, search: query, page: 1 })}
            />
          </div>
        </aside>
        <div className="flex-1 min-w-0">
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {chips.map((c) => (
                <span
                  key={c.key}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                >
                  {c.label}
                  <button
                    type="button"
                    className="hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center -m-1"
                    onClick={() => {
                      removeChip(c.key, filters, handleFilterChange);
                      pushUrl({ page: 1 });
                    }}
                    aria-label={`Remove filter ${c.label}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                Clear all
              </Button>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {found.toLocaleString()} jobs found
              </p>
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={async () => {
                    const freq = window.prompt("Alert frequency: IMMEDIATE, DAILY, or WEEKLY?", "DAILY");
                    if (!freq || !["IMMEDIATE", "DAILY", "WEEKLY"].includes(freq.toUpperCase())) return;
                    const res = await fetch("/api/alerts", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: filters.search || "My search",
                        query: filters.search,
                        filters,
                        frequency: freq.toUpperCase(),
                      }),
                    });
                    if (res.ok) alert("Alert created.");
                    else alert((await res.json()).error || "Failed");
                  }}
                >
                  Get alerts for this search
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant={sort === "recent" ? "default" : "outline"}
                size="sm"
                onClick={() => pushUrl({ sort: "recent", page: 1 })}
              >
                Most Recent
              </Button>
              <Button
                variant={sort === "salary" ? "default" : "outline"}
                size="sm"
                onClick={() => pushUrl({ sort: "salary", page: 1 })}
              >
                Salary
              </Button>
              <Button
                variant={sort === "relevance" ? "default" : "outline"}
                size="sm"
                onClick={() => pushUrl({ sort: "relevance", page: 1 })}
              >
                Relevance
              </Button>
            </div>
          </div>
          {loading ? (
            <ul className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i}>
                  <JobCardSkeleton />
                </li>
              ))}
            </ul>
          ) : error ? (
            <div className="ascend-card p-8 text-center text-muted-foreground">
              <p>Search is temporarily unavailable. Showing recent jobs.</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => pushUrl({ ...defaultFilters, page: 1 })}>
                Try again
              </Button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="ascend-card p-8 text-center text-muted-foreground">
              <p>No jobs match your search. Try adjusting your filters.</p>
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              <ErrorBoundary>
                <ul className="space-y-3">
                  {jobs.map((job) => (
                    <li key={job.id}>
                      <JobCard
                        job={job}
                        fitScore={fitScoresMap[job.id] ?? null}
                        preferredCurrency={(session?.user as { preferredCurrency?: string } | undefined)?.preferredCurrency}
                      />
                    </li>
                  ))}
                </ul>
              </ErrorBoundary>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => pushUrl({ page: page - 1 })}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-2 text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => pushUrl({ page: page + 1 })}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
