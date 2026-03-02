"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminEngagementDetailPage() {
  const params = useParams();
  const contractId = params.contractId as string;
  const [interveneAction, setInterveneAction] = useState<string>("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { data, mutate } = useSWR(
    contractId ? `/api/admin/mentorship/engagements/${contractId}` : null,
    fetcher
  );

  const handleIntervene = async () => {
    if (!interveneAction || !reason.trim() || reason.trim().length < 20) {
      setError("Select an action and provide a reason (min 20 characters).");
      return;
    }
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/admin/mentorship/engagements/${contractId}/intervene`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: interveneAction, reason: reason.trim() }),
    });
    const json = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error ?? "Failed to submit intervention.");
      return;
    }
    setInterveneAction("");
    setReason("");
    mutate();
  };

  if (!data) return <div className="p-6">Loading…</div>;
  if (data.error) return <div className="p-6 text-destructive">{data.error}</div>;

  const { contract, sessions, outcome, auditLog, flags } = data;

  return (
    <div className="space-y-6 p-6">
      <Link href="/dashboard/admin/mentorship" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Mentorship Ops
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Engagement {contractId.slice(0, 8)}…</h1>
        {flags?.critical && <Badge variant="destructive">Critical</Badge>}
        {contract?.status === "PAUSED" && <Badge variant="secondary">Paused by Ops</Badge>}
      </div>

      <Card>
        <CardHeader><CardTitle>Contract</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>Status: <Badge variant="outline">{contract?.status}</Badge></p>
          <p>Mentor: {contract?.mentor?.name ?? contract?.mentor?.email ?? "—"}</p>
          <p>Mentee: {contract?.mentee?.name ?? contract?.mentee?.email ?? "—"}</p>
          <p>Type: {contract?.engagementType}</p>
          <p>Start: {contract?.engagementStart ? new Date(contract.engagementStart).toLocaleDateString() : "—"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Sessions</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {(sessions ?? []).map((s: { sessionNumber: number; status: string; completedAt: string | null }) => (
              <li key={s.sessionNumber}>Session {s.sessionNumber}: {s.status} {s.completedAt ? `— ${new Date(s.completedAt).toLocaleString()}` : ""}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {outcome && (
        <Card>
          <CardHeader><CardTitle>Outcome</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <p>Status: {outcome.status}</p>
            <p>Transition: {outcome.transitionType}</p>
            {outcome.acknowledgementDeadline && <p>Deadline: {new Date(outcome.acknowledgementDeadline).toLocaleString()}</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Audit log</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {(auditLog ?? []).slice(0, 10).map((e: { id: string; action: string; actorName: string; createdAt: string }) => (
              <li key={e.id}>{new Date(e.createdAt).toLocaleString()} — {e.actorName}: {e.action}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {contract?.status === "ACTIVE" || contract?.status === "PAUSED" ? (
        <Card>
          <CardHeader><CardTitle>Intervene</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Warn mentor, warn mentee, or pause engagement. Reason required (min 20 characters).</p>
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={interveneAction} onValueChange={setInterveneAction}>
                <SelectTrigger><SelectValue placeholder="Select action" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WARN_MENTOR">Warn mentor</SelectItem>
                  <SelectItem value="WARN_MENTEE">Warn mentee</SelectItem>
                  <SelectItem value="PAUSE_ENGAGEMENT">Pause engagement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason (min 20 characters)</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for intervention…" rows={3} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleIntervene} disabled={submitting}>Submit</Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
