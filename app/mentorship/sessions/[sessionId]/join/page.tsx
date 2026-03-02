"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SessionJoinPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [consentOpen, setConsentOpen] = useState(true);
  const [consented, setConsented] = useState(false);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [stenoActive, setStenoActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConsent = async (acknowledged: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acknowledged }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setConsented(acknowledged);
      setConsentOpen(false);
      if (acknowledged) setStenoActive(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!consented) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/room`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to get room");
        if (cancelled) return;
        setRoomUrl(data.roomUrl);
        setToken(data.token);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed");
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId, consented]);

  if (error && !roomUrl) {
    return (
      <div className="container max-w-2xl py-12">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Dialog open={consentOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Session recording consent</DialogTitle>
            <DialogDescription>
              This session may be transcribed for generating a session record (discussion summary,
              commitments, action items). Audio is never stored. Do you consent to transcription?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => handleConsent(false)}
              disabled={loading}
            >
              No
            </Button>
            <Button onClick={() => handleConsent(true)} disabled={loading}>
              Yes
            </Button>
          </DialogFooter>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </DialogContent>
      </Dialog>

      {stenoActive && consented && (
        <div className="px-4 py-2 bg-muted/50 text-sm flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Steno active — transcript will be used for session record
        </div>
      )}

      {roomUrl && token ? (
        <div className="flex-1 min-h-0">
          <iframe
            src={`${roomUrl}?t=${encodeURIComponent(token)}`}
            allow="camera;microphone;fullscreen;display-capture"
            className="w-full h-full min-h-[60vh] border-0"
            title="Session room"
          />
        </div>
      ) : consented && !error ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading room…</p>
        </div>
      ) : null}
    </div>
  );
}
