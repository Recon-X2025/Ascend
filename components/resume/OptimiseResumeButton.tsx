"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap } from "lucide-react";
import { useResumeVersions } from "@/hooks/useResumeVersions";

interface OptimiseResumeButtonProps {
  jobPostId: number;
  jobTitle: string;
}

export function OptimiseResumeButton({ jobPostId, jobTitle }: OptimiseResumeButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { versions, isLoading } = useResumeVersions({ baseOnly: true });

  const handleOptimise = async () => {
    if (!selectedVersionId) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/resume/optimise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobPostId, baseVersionId: selectedVersionId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start optimisation");

      router.push(
        `/dashboard/resume/optimise/${data.sessionId}?jobPostId=${jobPostId}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="default" className="gap-2" onClick={() => setOpen(true)}>
        <Zap className="h-4 w-4" />
        Optimise Resume for This Job
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Optimise Resume for This Role</DialogTitle>
            <DialogDescription>
              Select a base resume to tailor for <strong>{jobTitle}</strong>. Your
              content will be reorganised and reworded to match this JD — no content
              will be invented.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading your resumes...</p>
            ) : versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You don&apos;t have any base resume versions yet. Create one in the
                Resume Builder first.
              </p>
            ) : (
              <Select onValueChange={setSelectedVersionId} value={selectedVersionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a base resume" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              onClick={handleOptimise}
              disabled={!selectedVersionId || loading}
              className="w-full"
            >
              {loading ? "Starting optimisation..." : "Start Optimising"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
