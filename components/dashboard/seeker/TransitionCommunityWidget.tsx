"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))));

interface TransitionSignalsData {
  hasPath: boolean;
  pathLabel: string | null;
  count: number;
  rounded: number;
  completions: number;
}

export function TransitionCommunityWidget() {
  const { data } = useSWR<{ success: boolean; data: TransitionSignalsData }>(
    "/api/community/transition-signals",
    fetcher
  );

  const d = data?.data;
  if (!d?.hasPath || !d.pathLabel || d.rounded === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" /> Your path
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground">
          <span className="font-semibold">{d.rounded}</span>{" "}
          {d.rounded === 1 ? "person is" : "people are"} on the same{" "}
          <span className="font-medium">{d.pathLabel}</span> path as you.
        </p>
        {d.completions > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {d.completions} {d.completions === 1 ? "has" : "have"} completed this transition on Ascend.
          </p>
        )}
        <div className="flex gap-4 mt-2">
          <Link href="/mentorship" className="text-xs text-primary hover:underline">
            Find mentors →
          </Link>
          <Link href="/cohorts" className="text-xs text-primary hover:underline">
            Join cohort →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
