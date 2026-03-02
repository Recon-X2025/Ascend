"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PERSONA_COLORS, PERSONA_LABELS } from "./PersonaColors";

export type PersonaStats = {
  count: number;
  avgCompletionScore: number;
  avgSessionsPerUser: number;
  avgJobApplications: number;
  retentionRate7d: number;
  retentionRate30d: number;
  topFeatures: string[];
};

export function PersonaCard({
  persona,
  stats,
  totalUsers,
}: {
  persona: string;
  stats: PersonaStats;
  totalUsers: number;
}) {
  const pct = totalUsers > 0 ? Math.round((stats.count / totalUsers) * 100) : 0;
  const color = PERSONA_COLORS[persona] ?? PERSONA_COLORS.NO_PERSONA;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          {PERSONA_LABELS[persona] ?? persona}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <span className="font-medium">{stats.count.toLocaleString()}</span> users ({pct}%)
        </p>
        <p className="text-muted-foreground">Avg completion: {stats.avgCompletionScore}</p>
        <p className="text-muted-foreground">Avg applications: {stats.avgJobApplications}</p>
        <p className="text-muted-foreground">7d retention: {stats.retentionRate7d}%</p>
        <p className="text-muted-foreground">30d retention: {stats.retentionRate30d}%</p>
        {stats.topFeatures.length > 0 && (
          <p className="text-muted-foreground pt-1">
            Top: {stats.topFeatures.slice(0, 3).join(", ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
