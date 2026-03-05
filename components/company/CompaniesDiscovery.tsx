"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CompanyItem {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
  industry: string | null;
  type: string | null;
  size: string | null;
  verified: boolean;
  reviewCount: number;
  overallRating: number | null;
}

export function CompaniesDiscovery() {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    setLoading(true);
    fetch(`/api/companies?${params}`)
      .then(async (r) => {
        const text = await r.text();
        if (!text.trim()) return { success: false };
        try {
          return JSON.parse(text) as { success?: boolean; data?: CompanyItem[]; meta?: { total?: number } };
        } catch {
          return { success: false };
        }
      })
      .then((j) => {
        if (j.success) {
          setCompanies(j.data ?? []);
          setTotal(j.meta?.total ?? 0);
        }
      })
      .catch(() => {
        setCompanies([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search companies..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
      </div>
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : companies.length === 0 ? (
        <p className="text-muted-foreground">No companies found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <Link key={c.id} href={`/companies/${c.slug}`}>
              <div className="ascend-card flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors">
                {c.logo ? (
                  <Image src={c.logo} alt="" width={48} height={48} className="h-12 w-12 rounded object-contain bg-muted" unoptimized />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{c.name}</span>
                    {c.verified && (
                      <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-800">
                        Verified
                      </span>
                    )}
                  </div>
                  {(c.industry || c.size) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[c.industry, c.size].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    {c.reviewCount >= 3 && c.overallRating != null && (
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {c.overallRating.toFixed(1)} ({c.reviewCount} reviews)
                      </span>
                    )}
                    {c.reviewCount < 3 && (
                      <span className="text-muted-foreground">({c.reviewCount} reviews)</span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
            </Link>
          ))}
        </div>
      )}
      {total > limit && (
        <div className="flex justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
