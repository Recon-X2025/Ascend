"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CompanySalariesTab({ slug }: { slug: string }) {
  const [data, setData] = useState<{ salaries: Array<{ jobTitle: string; count: number; available: boolean; median?: number; p25?: number; p75?: number; min?: number; max?: number; avgBonus?: number; locations?: string[] }> } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/companies/${slug}/salaries`).then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, [slug]);

  if (loading || !data) return <p className="mt-6 text-muted-foreground">Loading...</p>;
  return (
    <div className="mt-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Salaries</h2>
        <Button asChild><Link href={`/companies/${slug}/salaries/new`}>Add Your Salary</Link></Button>
      </div>
      <div className="space-y-4">
        {data.salaries.map((s) => (
          <Card key={s.jobTitle}><CardContent className="pt-6">
            <p className="font-medium">{s.jobTitle}</p>
            {s.available ? (
              <>
                <p className="text-2xl font-semibold mt-1">₹ {(s.median ?? 0).toLocaleString()} median</p>
                <p className="text-sm text-muted-foreground">Range: ₹ {(s.min ?? 0).toLocaleString()} – ₹ {(s.max ?? 0).toLocaleString()} · Based on {s.count} salaries</p>
                {s.locations && s.locations.length > 0 && <p className="text-xs text-muted-foreground mt-1">{s.locations.join(", ")}</p>}
              </>
            ) : (
              <p className="text-muted-foreground text-sm mt-1">Not enough data yet ({s.count} submissions)</p>
            )}
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
