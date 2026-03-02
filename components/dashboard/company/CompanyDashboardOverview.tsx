"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CompanyDashboardOverviewProps {
  slug: string;
}

export function CompanyDashboardOverview({ slug }: CompanyDashboardOverviewProps) {
  const [stats, setStats] = useState({ reviewCount: 0, avgRating: 0, qaCount: 0, jobViews: 0, followers: 0 });
  const [reviews, setReviews] = useState<{ id: string; overallRating: number; jobTitle: string; createdAt: string }[]>([]);

  useEffect(() => {
    fetch(`/api/companies/${slug}/reviews?limit=3`).then((r) => r.json()).then((d) => {
      if (d.reviews) {
        setReviews(d.reviews.slice(0, 3).map((r: { id: string; overallRating: number; jobTitle: string; createdAt: string }) => ({ id: r.id, overallRating: r.overallRating, jobTitle: r.jobTitle, createdAt: r.createdAt })));
        setStats((s) => ({ ...s, reviewCount: d.totalCount ?? 0, avgRating: d.averageRating ?? 0 }));
      }
    });
    fetch(`/api/companies/${slug}/qa?limit=1`).then((r) => r.json()).then((d) => {
      setStats((s) => ({ ...s, qaCount: d.totalCount ?? 0 }));
    });
  }, [slug]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total reviews</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{stats.reviewCount}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Average rating</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">⭐ {stats.avgRating.toFixed(1)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Q&A questions</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{stats.qaCount}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Job views</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{stats.jobViews}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Followers</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{stats.followers}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Recent reviews</CardTitle></CardHeader>
        <CardContent>
          {reviews.length === 0 ? <p className="text-muted-foreground text-sm">No approved reviews yet.</p> : (
            <ul className="space-y-2">
              {reviews.map((r) => (
                <li key={r.id} className="flex justify-between text-sm">
                  <span>{r.jobTitle}</span>
                  <span>⭐ {r.overallRating}</span>
                  <span className="text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button asChild><Link href="/jobs/post-a-job">Post a Job</Link></Button>
        <Button variant="outline" asChild><Link href={`/companies/${slug}`}>View Company Page</Link></Button>
      </div>
    </div>
  );
}
