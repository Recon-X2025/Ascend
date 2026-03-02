"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const TRENDING = [
  { label: "Product Manager", q: "Product Manager" },
  { label: "Software Engineer", q: "Software Engineer" },
  { label: "Data Analyst", q: "Data Analyst" },
  { label: "Bangalore", location: "Bangalore" },
  { label: "Remote", location: "Remote" },
];

export function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (location) params.set("location", location);
    router.push("/jobs?" + params.toString());
  };

  const applyTrending = (item: (typeof TRENDING)[number]) => {
    const qVal = "q" in item ? item.q : undefined;
    const locVal = "location" in item ? item.location : undefined;
    if (qVal != null) setQ(qVal);
    if (locVal != null) setLocation(locVal);
    const params = new URLSearchParams();
    if (qVal) params.set("q", qVal);
    if (locVal) params.set("location", locVal);
    router.push("/jobs?" + params.toString());
  };

  return (
    <div className="w-full max-w-[640px] mx-auto">
      <form
        onSubmit={handleSubmit}
        className="flex rounded-[10px] overflow-hidden border border-border bg-surface-2 h-14 transition-[border-color] duration-150 focus-within:border-border-mid"
      >
        <input
          type="search"
          placeholder="Role, skill, or company"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 min-w-0 bg-transparent px-4 text-ink placeholder:text-ink-4 text-sm font-body outline-none"
          aria-label="Search by role, skill, or company"
        />
        <div className="w-px bg-border shrink-0" />
        <input
          type="text"
          placeholder="City or remote"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-[180px] bg-transparent px-4 text-ink placeholder:text-ink-4 text-sm font-body outline-none"
          aria-label="Location"
        />
        <button
          type="submit"
          className="shrink-0 bg-green text-white font-body font-medium px-5 text-sm rounded-r-[10px] hover:bg-green-dark transition-colors"
        >
          Search →
        </button>
      </form>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="font-body text-[0.75rem] text-ink-3 tracking-[0.1em]">
          Trending:
        </span>
        {TRENDING.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => applyTrending(item)}
            className="font-body text-xs text-ink-2 border border-border rounded-full px-3 py-1 hover:border-green hover:text-green transition-colors"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
