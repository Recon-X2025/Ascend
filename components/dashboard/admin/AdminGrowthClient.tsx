"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function AdminGrowthClient() {
  const { data: referrals, isLoading: refLoading } = useSWR(
    "/api/admin/growth/referrals",
    fetcher
  );
  const { data: shares, isLoading: sharesLoading } = useSWR(
    "/api/admin/growth/shares",
    fetcher
  );
  const { data: topReferrers, isLoading: topLoading } = useSWR(
    "/api/admin/growth/top-referrers",
    fetcher
  );

  const isLoading = refLoading || sharesLoading || topLoading;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="h-32 rounded-lg bg-muted animate-pulse" />
        <div className="h-32 rounded-lg bg-muted animate-pulse" />
        <div className="h-32 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  const funnel = referrals
    ? {
        codes: referrals.totalReferralCodes ?? 0,
        clicks: referrals.totalClicks ?? 0,
        signups: referrals.totalSignups ?? 0,
        conversions: referrals.totalConversions ?? 0,
      }
    : { codes: 0, clicks: 0, signups: 0, conversions: 0 };

  const byChannel = (shares?.byChannel ?? []) as { channel: string; count: number }[];
  const top = (topReferrers?.topReferrers ?? []) as {
    userId: string;
    name: string | null;
    email: string | null;
    code: string;
    clicks: number;
    signups: number;
    conversions: number;
  }[];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Referral codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{funnel.codes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{funnel.clicks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Signups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{funnel.signups}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{funnel.conversions}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Share events by channel (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {byChannel.length === 0 ? (
              <p className="text-sm text-muted-foreground">No share events yet</p>
            ) : (
              <div className="space-y-2">
                {byChannel.map(({ channel, count }) => (
                  <div key={channel} className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium">{channel}</span>
                    <div className="flex-1 h-6 bg-muted rounded overflow-hidden max-w-[200px]">
                      <div
                        className="h-full bg-primary/70 rounded"
                        style={{
                          width: `${Math.min(100, (count / Math.max(...byChannel.map((c) => c.count), 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 10 referrers (by conversions)</CardTitle>
          </CardHeader>
          <CardContent>
            {top.length === 0 ? (
              <p className="text-sm text-muted-foreground">No referrers yet</p>
            ) : (
              <div className="space-y-3">
                {top.map((r) => (
                  <div
                    key={r.userId}
                    className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{r.name ?? r.email ?? r.code}</p>
                      <p className="text-xs text-muted-foreground">{r.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{r.conversions} converted</p>
                      <p className="text-xs text-muted-foreground">
                        {r.signups} signups · {r.clicks} clicks
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
