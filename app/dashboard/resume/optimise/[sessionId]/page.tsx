"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";

type SessionStatus = "PENDING" | "PROCESSING" | "DONE" | "FAILED";

interface GapAnalysis {
  present: string[];
  missing: string[];
  rewritten: number;
  fabricationBlockedCount: number;
}

interface SessionData {
  sessionId: string;
  status: SessionStatus;
  fitScoreBefore: number | null;
  fitScoreAfter: number | null;
  gapAnalysis: GapAnalysis | null;
  errorMessage: string | null;
  outputVersion: {
    id: string;
    name: string;
    createdAt: string;
  } | null;
  jobSlug: string | null;
}

export default function OptimiseSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

  const [data, setData] = useState<SessionData | null>(null);

  const fetchStatus = async () => {
    const res = await fetch(`/api/resume/optimise/${sessionId}`);
    if (!res.ok) return;
    const json: SessionData = await res.json();
    setData(json);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const isProcessing =
    !data || data.status === "PENDING" || data.status === "PROCESSING";

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Resume Optimisation</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your resume is being tailored for this specific role — using only your
          existing experience.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
            {data?.status === "DONE" && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            {data?.status === "FAILED" && (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            {isProcessing
              ? "Optimising your resume..."
              : data?.status === "DONE"
                ? "Optimisation complete"
                : "Optimisation failed"}
          </CardTitle>
          {isProcessing && (
            <CardDescription>
              This usually takes 15–30 seconds. You can leave this page and come
              back.
            </CardDescription>
          )}
        </CardHeader>
      </Card>

      {data?.status === "DONE" && data.gapAnalysis && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What was optimised</CardTitle>
              <CardDescription>
                {data.gapAnalysis.rewritten} bullet
                {data.gapAnalysis.rewritten !== 1 ? "s" : ""} rewritten using JD
                language • All changes are based on your existing experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.gapAnalysis.present.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    Keywords now covered in your resume
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.gapAnalysis.present.map((kw) => (
                      <Badge key={kw} variant="secondary" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {data.gapAnalysis.missing.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    Skill gaps — not in your profile
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    These JD keywords were not found in your profile. Add them to
                    your profile if you genuinely have this experience.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.gapAnalysis.missing.map((kw) => (
                      <Badge
                        key={kw}
                        variant="outline"
                        className="text-xs text-muted-foreground"
                      >
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {data.outputVersion && (
            <div className="flex gap-3 flex-wrap">
              <Button asChild>
                <Link href="/resume/versions">View optimised resume</Link>
              </Button>
              {data.jobSlug && (
                <Button variant="outline" asChild>
                  <Link
                    href={`/jobs/${data.jobSlug}/apply?versionId=${data.outputVersion?.id}`}
                  >
                    Apply with this version
                  </Link>
                </Button>
              )}
              <Button variant="ghost" asChild>
                <Link href="/profile/edit">Update profile to close gaps</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      {data?.status === "FAILED" && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              {data.errorMessage ?? "Something went wrong. Please try again."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
