"use client";

import useSWR from "swr";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function ResumeReviewList() {
  const { data } = useSWR("/api/marketplace/resume-review", fetcher);
  const items = data?.items ?? [];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((p: { id: string; user?: { name: string | null; image: string | null }; bio: string; specialisations: string[]; pricePerSession: number; currency: string; avgRating: number | null; turnaroundHours: number | null }) => (
        <Link key={p.id} href={`/marketplace/resume-review/${p.id}`}>
          <Card variant="interactive" className="h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={p.user?.image ?? undefined} />
                  <AvatarFallback>{(p.user?.name ?? "?")[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{p.user?.name ?? "Provider"}</p>
                  <p className="text-sm text-muted-foreground">{p.specialisations?.slice(0, 2).join(", ")}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{p.bio}</p>
              <p className="text-sm font-medium">{p.currency === "INR" ? "₹" : "$"}{p.pricePerSession / 100} · {p.turnaroundHours != null ? `${p.turnaroundHours}h` : "—"} turnaround</p>
              {p.avgRating != null && <p className="text-xs text-muted-foreground">★ {p.avgRating.toFixed(1)}</p>}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
