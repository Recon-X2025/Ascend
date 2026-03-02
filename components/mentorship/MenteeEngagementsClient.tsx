"use client";

import useSWR from "swr";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function MenteeEngagementsClient() {
  const { data: summary } = useSWR<{
    applicationsSubmitted: number;
    engagementsCompleted: number;
    engagementsActive: number;
    goalsAchieved: number;
    actionItemsPending: number;
    sixMonthCheckinDue: boolean;
    checkinsCompleted: number;
  }>("/api/mentorship/analytics/mentee/me", fetcher);

  const { data: engagements } = useSWR<Array<{
    id: string;
    mentorFirstName: string;
    transitionType: string | null;
    startDate: string | null;
    status: string;
    milestonesComplete: number;
    milestonesTotal: number;
    outcomeStatus: string | null;
    checkInStatus: string | null;
    checkInDueAt: string | null;
    checkInCompletedAt: string | null;
  }>>("/api/mentorship/analytics/mentee/me/engagements", fetcher);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0F1A0F]">My engagements</h1>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Applications submitted</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold">{summary?.applicationsSubmitted ?? "—"}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Engagements active</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold">{summary?.engagementsActive ?? "—"}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Engagements completed</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold">{summary?.engagementsCompleted ?? "—"}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Goals achieved</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold">{summary?.goalsAchieved ?? "—"}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Action items pending</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold">{summary?.actionItemsPending ?? "—"}</span></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Engagements</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mentor</TableHead>
                <TableHead>Transition</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Milestones</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(engagements ?? []).map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.mentorFirstName}</TableCell>
                  <TableCell>{e.transitionType ?? "—"}</TableCell>
                  <TableCell>{e.startDate?.slice(0, 10) ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline">{e.status}</Badge></TableCell>
                  <TableCell>{e.milestonesComplete}/{e.milestonesTotal}</TableCell>
                  <TableCell>{e.outcomeStatus ?? "—"}</TableCell>
                  <TableCell>
                    {e.outcomeStatus === "VERIFIED"
                      ? (e.checkInStatus === "COMPLETED"
                          ? "Check-in complete"
                          : e.checkInCompletedAt
                            ? e.checkInCompletedAt.slice(0, 10)
                            : e.checkInDueAt
                              ? "Due " + e.checkInDueAt.slice(0, 10)
                              : "-")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {e.status === "ACTIVE" && (
                      <Link href={`/mentorship/contracts/${e.id}`} className="text-green hover:underline text-sm">
                        View Engagement
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(engagements?.length ?? 0) === 0 && (
            <p className="text-muted-foreground text-sm py-4">No engagements yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
