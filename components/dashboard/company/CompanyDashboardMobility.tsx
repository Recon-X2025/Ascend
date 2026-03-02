"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MobilityStats {
  internalFillRate: number;
  avgTimeToFillInternal: number | null;
  avgTimeToFillExternal: number | null;
  referralConversionRate: number;
  referralLeaderboard: { referrerId: string; name: string; sent: number; applied: number; hired: number }[];
  internalJobPerformance: {
    id: number;
    title: string;
    postedDate: string;
    applications: number;
    shortlisted: number;
    hired: number;
    daysOpen: number;
  }[];
}

interface CompanyDashboardMobilityProps {
  slug: string;
}

export function CompanyDashboardMobility({ slug }: CompanyDashboardMobilityProps) {
  const [data, setData] = useState<MobilityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/companies/${slug}/mobility-analytics`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "Forbidden" : "Failed to load");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="text-muted-foreground">Loading mobility analytics…</div>
    );
  }
  if (error) {
    return (
      <div className="text-destructive">
        {error === "Forbidden" ? "You don’t have access to this data." : error}
      </div>
    );
  }
  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Internal Fill Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{data.internalFillRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              Jobs filled internally vs total closed (last 90 days)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Time to Fill (Internal)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {data.avgTimeToFillInternal != null ? `${data.avgTimeToFillInternal} days` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Time to Fill (External)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {data.avgTimeToFillExternal != null ? `${data.avgTimeToFillExternal} days` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Referral Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{data.referralConversionRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              Referrals → applied / hired (last 90 days)
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referral Leaderboard</CardTitle>
          <p className="text-sm text-muted-foreground">Top referrers in the last 90 days</p>
        </CardHeader>
        <CardContent>
          {data.referralLeaderboard.length === 0 ? (
            <p className="text-muted-foreground text-sm">No referrals yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Name</th>
                    <th className="text-right py-2 font-medium">Sent</th>
                    <th className="text-right py-2 font-medium">Applied</th>
                    <th className="text-right py-2 font-medium">Hired</th>
                  </tr>
                </thead>
                <tbody>
                  {data.referralLeaderboard.map((row) => (
                    <tr key={row.referrerId} className="border-b last:border-0">
                      <td className="py-2">{row.name}</td>
                      <td className="text-right py-2">{row.sent}</td>
                      <td className="text-right py-2">{row.applied}</td>
                      <td className="text-right py-2">{row.hired}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Internal Job Performance</CardTitle>
          <p className="text-sm text-muted-foreground">INTERNAL jobs (last 90 days)</p>
        </CardHeader>
        <CardContent>
          {data.internalJobPerformance.length === 0 ? (
            <p className="text-muted-foreground text-sm">No internal jobs in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Title</th>
                    <th className="text-right py-2 font-medium">Posted</th>
                    <th className="text-right py-2 font-medium">Applications</th>
                    <th className="text-right py-2 font-medium">Shortlisted</th>
                    <th className="text-right py-2 font-medium">Hired</th>
                    <th className="text-right py-2 font-medium">Days open</th>
                  </tr>
                </thead>
                <tbody>
                  {data.internalJobPerformance.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2">{row.title}</td>
                      <td className="text-right py-2">
                        {new Date(row.postedDate).toLocaleDateString()}
                      </td>
                      <td className="text-right py-2">{row.applications}</td>
                      <td className="text-right py-2">{row.shortlisted}</td>
                      <td className="text-right py-2">{row.hired}</td>
                      <td className="text-right py-2">{row.daysOpen}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
