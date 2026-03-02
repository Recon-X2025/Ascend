"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminMentorDetailPage() {
  const params = useParams();
  const mentorId = params.mentorId as string;
  const { data } = useSWR(
    mentorId ? `/api/admin/mentorship/mentors/${mentorId}` : null,
    fetcher
  );

  if (!data) return <div className="p-6">Loading…</div>;
  if (data.error) return <div className="p-6 text-destructive">{data.error}</div>;

  const { profile, tierHistory, engagements, outcomeStats, auditLog } = data;

  return (
    <div className="space-y-6 p-6">
      <Link href="/dashboard/admin/mentorship" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Mentorship Ops
      </Link>

      <h1 className="text-2xl font-bold">{profile?.name ?? profile?.email ?? mentorId}</h1>

      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>Tier: <Badge variant="outline">{profile?.tier}</Badge></p>
          <p>Verification: {profile?.verificationStatus}</p>
          <p>Verified outcomes: {profile?.verifiedOutcomeCount}</p>
          <p>Dispute rate: {profile?.disputeRate != null ? `${(profile.disputeRate * 100).toFixed(0)}%` : "—"}</p>
          <p>Active mentees: {profile?.activeMenteeCount} / {profile?.maxActiveMentees}</p>
          <p>Current role: {profile?.currentRole}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Outcome stats</CardTitle></CardHeader>
        <CardContent className="text-sm">
          <p>Verified: {outcomeStats?.verified ?? 0}</p>
          <p>Disputed: {outcomeStats?.disputed ?? 0}</p>
          <p>Unacknowledged: {outcomeStats?.unacknowledged ?? 0}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tier history</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {(tierHistory ?? []).map((h: { id: string; previousTier: string; newTier: string; reason: string; createdAt: string }) => (
              <li key={h.id}>{new Date(h.createdAt).toLocaleString()} — {h.previousTier} → {h.newTier} ({h.reason})</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Engagements</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {(engagements ?? []).map((e: { contractId: string; status: string; engagementType: string; menteeName: string }) => (
              <li key={e.contractId}>
                <Link href={`/dashboard/admin/mentorship/engagements/${e.contractId}`} className="text-primary underline">
                  {e.engagementType} — {e.menteeName} ({e.status})
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Audit log</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {(auditLog ?? []).slice(0, 15).map((e: { id: string; action: string; actorName: string; createdAt: string }) => (
              <li key={e.id}>{new Date(e.createdAt).toLocaleString()} — {e.actorName}: {e.action}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
