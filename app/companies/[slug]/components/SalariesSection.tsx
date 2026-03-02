"use client";

import { useEffect, useState } from "react";
import { SalaryAggregateTable } from "@/components/reviews/SalaryAggregateTable";

interface SalariesSectionProps {
  companyId: string;
}

export function SalariesSection({ companyId }: SalariesSectionProps) {
  const [data, setData] = useState<{
    available: boolean;
    aggregates: Array<{
      jobTitle: string;
      median: number;
      p25: number;
      p75: number;
      count: number;
      year?: number;
    }> | null;
    message?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reviews/salary?companyId=${companyId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [companyId]);

  if (loading && !data) return <p className="text-muted-foreground mt-6">Loading...</p>;

  return (
    <div className="mt-6">
      <SalaryAggregateTable
        companyId={companyId}
        available={data?.available ?? false}
        aggregates={data?.aggregates ?? null}
        message={data?.message}
      />
    </div>
  );
}
