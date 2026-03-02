"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatSalaryShort } from "@/lib/salary/format";
import { DataSourceBadge } from "./DataSourceBadge";
import { cn } from "@/lib/utils";

interface TrendingRole {
  role: string;
  roleSlug: string;
  median: number;
  count: number;
}

interface TrendingRolesStripProps {
  className?: string;
}

export function TrendingRolesStrip({ className }: TrendingRolesStripProps) {
  const [roles, setRoles] = useState<TrendingRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/salary/trending?limit=10")
      .then((r) => r.json())
      .then((data) => setRoles(data.roles ?? []))
      .catch(() => setRoles([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || roles.length === 0) return null;

  return (
    <div className={cn("w-full overflow-x-auto pb-2", className)}>
      <h3 className="text-sm font-medium text-ink-3 mb-2">Trending roles</h3>
      <div className="flex gap-3 min-w-max">
        {roles.map((r) => (
          <Link
            key={r.roleSlug}
            href={`/salary/roles/${r.roleSlug}`}
            className="shrink-0 rounded-xl border border-border bg-surface px-4 py-3 w-44 hover:border-green/50 hover:shadow-sm transition-all"
          >
            <p className="font-medium text-ink truncate" title={r.role}>
              {r.role}
            </p>
            <p className="text-green-dark font-semibold mt-1">{formatSalaryShort(r.median)}</p>
            <DataSourceBadge sourceLabel="From job postings" className="mt-2" />
          </Link>
        ))}
      </div>
    </div>
  );
}
