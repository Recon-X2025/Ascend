"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface JobFiltersState {
  search: string;
  location: string;
  jobType: string[];
  workMode: string[];
  skills: string[];
  experienceMin: string;
  experienceMax: string;
  salaryMin: string;
  salaryMax: string;
  includeNotDisclosed: boolean;
  datePosted: string;
  easyApplyOnly: boolean;
  minRating: number;
  verifiedOnly: boolean;
}

export type FacetCounts = Record<
  string,
  { value: string; count: number }[] | undefined
>;

const JOB_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE", "TEMPORARY"];
const WORK_MODES = ["REMOTE", "HYBRID", "ONSITE", "FLEXIBLE"];

const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  FREELANCE: "Freelance",
  TEMPORARY: "Temporary",
};

const WORK_MODE_LABELS: Record<string, string> = {
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  ONSITE: "On-site",
  FLEXIBLE: "Flexible",
};

function facetCount(facets: FacetCounts | null, field: string, value: string): number {
  const list = facets?.[field];
  if (!list) return 0;
  const item = list.find((c) => c.value === value);
  return item?.count ?? 0;
}

export function JobFilters(props: {
  state: JobFiltersState;
  facets: FacetCounts | null;
  onChange: (next: Partial<JobFiltersState>) => void;
  onClear: () => void;
  showCompanyRating?: boolean;
  savedSearches?: { id: string; name: string; query: string; filters: unknown }[];
  onApplySavedSearch?: (query: string, filters: Partial<JobFiltersState>) => void;
}) {
  const { state, facets, onChange, onClear, showCompanyRating = true, savedSearches = [], onApplySavedSearch } = props;
  const [skillsExpanded, setSkillsExpanded] = useState(false);
  const [savedExpanded, setSavedExpanded] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");

  const skillOptions = useMemo(() => {
    const list = facets?.skills ?? [];
    const sorted = [...list].sort((a, b) => b.count - a.count);
    const filtered = skillSearch.trim()
      ? sorted.filter((s) => s.value.toLowerCase().includes(skillSearch.toLowerCase()))
      : sorted;
    return filtered;
  }, [facets?.skills, skillSearch]);

  const topSkills = skillOptions.slice(0, 10);
  const moreSkills = skillOptions.slice(10);
  const skillsToShow = skillsExpanded ? skillOptions : topSkills;

  const toggleJobType = (t: string) => {
    const next = state.jobType.includes(t) ? state.jobType.filter((x) => x !== t) : [...state.jobType, t];
    onChange({ jobType: next });
  };
  const toggleWorkMode = (w: string) => {
    const next = state.workMode.includes(w) ? state.workMode.filter((x) => x !== w) : [...state.workMode, w];
    onChange({ workMode: next });
  };
  const toggleSkill = (s: string) => {
    const next = state.skills.includes(s) ? state.skills.filter((x) => x !== s) : [...state.skills, s];
    onChange({ skills: next });
  };

  return (
    <div className="space-y-4">
      {savedSearches.length > 0 && (
        <div>
          <button
            type="button"
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setSavedExpanded((v) => !v)}
          >
            {savedExpanded ? "▼" : "▶"} Your saved searches
          </button>
          {savedExpanded && (
            <div className="mt-2 space-y-1 pl-4">
              {savedSearches.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="block w-full text-left text-sm text-primary hover:underline"
                  onClick={() => {
                    const f = (s.filters ?? {}) as Partial<JobFiltersState>;
                    onApplySavedSearch?.(s.query, { ...f, search: s.query });
                  }}
                >
                  {s.name || s.query || "Saved search"}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <Label className="text-xs">Location</Label>
        <Input placeholder="City" value={state.location} onChange={(e) => onChange({ location: e.target.value })} className="mt-1" />
      </div>

      <div className="border-t border-border/50 pt-4 mt-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Job type</p>
        {JOB_TYPES.map((t) => (
          <label key={t} className="flex items-center gap-2.5 py-1 cursor-pointer group">
            <Checkbox checked={state.jobType.includes(t)} onCheckedChange={() => toggleJobType(t)} />
            <span className="text-sm text-foreground group-hover:text-primary transition-colors">
              {JOB_TYPE_LABELS[t] ?? t.replace(/_/g, " ")}
            </span>
            {facets && <span className="ml-auto text-xs text-muted-foreground">({facetCount(facets, "jobType", t)})</span>}
          </label>
        ))}
      </div>

      <div className="border-t border-border/50 pt-4 mt-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Work mode</p>
        {WORK_MODES.map((w) => (
          <label key={w} className="flex items-center gap-2.5 py-1 cursor-pointer group">
            <Checkbox checked={state.workMode.includes(w)} onCheckedChange={() => toggleWorkMode(w)} />
            <span className="text-sm text-foreground group-hover:text-primary transition-colors">
              {WORK_MODE_LABELS[w] ?? w}
            </span>
            {facets && <span className="ml-auto text-xs text-muted-foreground">({facetCount(facets, "workMode", w)})</span>}
          </label>
        ))}
      </div>

      <div className="border-t border-border/50 pt-4 mt-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Skills</p>
        <Input
          placeholder="Filter skills..."
          value={skillSearch}
          onChange={(e) => setSkillSearch(e.target.value)}
          className="mb-2 h-8 text-sm"
        />
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {skillsToShow.map((s) => (
            <label key={s.value} className="flex items-center gap-2.5 py-1 cursor-pointer group">
              <Checkbox checked={state.skills.includes(s.value)} onCheckedChange={() => toggleSkill(s.value)} />
              <span className="text-sm text-foreground group-hover:text-primary transition-colors truncate min-w-0 flex-1">
                {s.value}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">({s.count})</span>
            </label>
          ))}
        </div>
        {moreSkills.length > 0 && !skillsExpanded && (
          <Button variant="ghost" size="sm" className="w-full text-xs mt-1" onClick={() => setSkillsExpanded(true)}>Show more</Button>
        )}
      </div>

      <div className="border-t border-border/50 pt-4 mt-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Refine</p>
        {showCompanyRating && (
          <div className="mb-3">
            <Label className="text-xs block mb-1.5">Min. company rating</Label>
            <Select
              value={String(state.minRating)}
              onValueChange={(val) => onChange({ minRating: parseFloat(val) })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n === 0 ? "Any" : n + "+"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="mb-3">
          <Label className="text-xs block mb-1.5">Date posted</Label>
          <Select
            value={state.datePosted || "__any__"}
            onValueChange={(val) => onChange({ datePosted: val === "__any__" ? "" : val })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center gap-2.5 py-1 cursor-pointer group">
          <Checkbox checked={state.easyApplyOnly} onCheckedChange={(c) => onChange({ easyApplyOnly: !!c })} />
          <span className="text-sm text-foreground group-hover:text-primary transition-colors">Easy Apply only</span>
        </label>
        <label className="flex items-center gap-2.5 py-1 cursor-pointer group">
          <Checkbox checked={state.includeNotDisclosed} onCheckedChange={(c) => onChange({ includeNotDisclosed: !!c })} />
          <span className="text-sm text-foreground group-hover:text-primary transition-colors">Include salary not disclosed</span>
        </label>
        <label className="flex items-center gap-2.5 py-1 cursor-pointer group">
          <Checkbox checked={state.verifiedOnly} onCheckedChange={(c) => onChange({ verifiedOnly: !!c })} />
          <span className="text-sm text-foreground group-hover:text-primary transition-colors">Verified companies only</span>
        </label>
      </div>

      <Button variant="outline" size="sm" onClick={onClear} className="w-full">Clear filters</Button>
    </div>
  );
}
