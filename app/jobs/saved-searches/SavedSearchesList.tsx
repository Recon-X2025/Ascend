"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Item = {
  id: string;
  name: string;
  query: string;
  filters: unknown;
  createdAt: Date;
};

function searchUrl(item: Item): string {
  const p = new URLSearchParams();
  if (item.query) p.set("search", item.query);
  const f = (item.filters ?? {}) as Record<string, unknown>;
  if (Array.isArray(f.jobType) && f.jobType.length) p.set("jobType", (f.jobType as string[]).join(","));
  if (Array.isArray(f.workMode) && f.workMode.length) p.set("workMode", (f.workMode as string[]).join(","));
  if (Array.isArray(f.skills) && f.skills.length) p.set("skills", (f.skills as string[]).join(","));
  if (f.location && typeof f.location === "string") p.set("location", f.location);
  if (f.datePosted && typeof f.datePosted === "string") p.set("datePosted", f.datePosted);
  return "/jobs?" + p.toString();
}

export function SavedSearchesList({ initialList }: { initialList: Item[] }) {
  const [list, setList] = useState(initialList);
  const [creatingAlertFor, setCreatingAlertFor] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    const res = await fetch("/api/search/saved/" + id, { method: "DELETE" });
    if (res.ok) setList((prev) => prev.filter((s) => s.id !== id));
  };

  if (list.length === 0) {
    return (
      <p className="text-muted-foreground">
        You have no saved searches. From the <Link href="/jobs" className="text-primary hover:underline">jobs page</Link>, run a search and click the bookmark icon to save it.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {list.map((item) => (
        <li key={item.id} className="ascend-card p-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium">{item.name || item.query || "Saved search"}</p>
            <p className="text-sm text-muted-foreground">{item.query || "—"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={searchUrl(item)}>Search again</Link>
            </Button>
            {creatingAlertFor === item.id ? (
              <span className="flex gap-1">
                {(["IMMEDIATE", "DAILY", "WEEKLY"] as const).map((freq) => (
                  <Button
                    key={freq}
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const res = await fetch("/api/alerts", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          savedSearchId: item.id,
                          name: item.name,
                          query: item.query,
                          filters: item.filters,
                          frequency: freq,
                        }),
                      });
                      if (res.ok) setCreatingAlertFor(null);
                    }}
                  >
                    {freq === "IMMEDIATE" ? "Now" : freq === "DAILY" ? "Daily" : "Weekly"}
                  </Button>
                ))}
                <Button variant="ghost" size="sm" onClick={() => setCreatingAlertFor(null)}>Cancel</Button>
              </span>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setCreatingAlertFor(item.id)}>
                Create Alert
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
