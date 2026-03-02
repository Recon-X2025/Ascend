"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function SessionExceptionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingException, setPendingException] = useState<{ id: string; note: string } | null>(null);
  const [canAcknowledge, setCanAcknowledge] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/exception`);
        if (!res.ok) return;
        const data = await res.json();
        const pending = data.pendingExceptions?.[0];
        if (pending) {
          setPendingException({ id: pending.id, note: pending.note });
          setCanAcknowledge(true);
        }
      } catch {
        // Error
      }
    })();
  }, [sessionId]);

  const handleFile = async () => {
    if (!note.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/exception`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("Exception filed. The other participant has been notified.");
      setNote("");
      if (data.contractId) router.push(`/mentorship/engagements/${data.contractId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to file exception");
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (action: "acknowledge" | "decline") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/exception/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(action === "acknowledge" ? "Exception acknowledged" : "Exception declined");
      setPendingException(null);
      setCanAcknowledge(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-xl py-12">
      <h1 className="text-2xl font-semibold mb-6">Session exception</h1>

      {pendingException && canAcknowledge && (
        <div className="mb-8 p-4 border rounded-lg bg-muted/30">
          <h2 className="font-medium mb-2">Pending exception to acknowledge</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{pendingException.note}</p>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => handleAcknowledge("acknowledge")} disabled={loading}>
              Acknowledge
            </Button>
            <Button variant="outline" onClick={() => handleAcknowledge("decline")} disabled={loading}>
              Decline
            </Button>
          </div>
        </div>
      )}

      <div>
        <h2 className="font-medium mb-2">File an exception</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Use this if there was an issue with the session (e.g. technical problems, no-show, etc.).
        </p>
        <Textarea
          placeholder="Describe the exception…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={5}
          className="mb-4"
        />
        <Button onClick={handleFile} disabled={loading || !note.trim()}>
          File exception
        </Button>
      </div>
    </div>
  );
}
