"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";

interface ExpectQuestion {
  question: string;
  category: string;
  why: string;
}

interface AskQuestion {
  question: string;
}

interface InterviewPrepClientProps {
  jobId: string | number;
  jobSlug: string;
}

export function InterviewPrepClient({ jobId, jobSlug }: InterviewPrepClientProps) {
  void jobSlug; // reserved for back link
  const [prep, setPrep] = useState<{
    expectQuestions: ExpectQuestion[];
    askQuestions: AskQuestion[];
    createdAt: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expectOpen, setExpectOpen] = useState(true);
  const [askOpen, setAskOpen] = useState(true);

  const fetchPrep = () => {
    setLoading(true);
    fetch(`/api/ai/interview-prep/${String(jobId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.interviewPrep) {
          setPrep({
            expectQuestions: j.interviewPrep.expectQuestions ?? [],
            askQuestions: j.interviewPrep.askQuestions ?? [],
            createdAt: j.interviewPrep.createdAt,
          });
        } else {
          setPrep(null);
        }
      })
      .catch(() => setPrep(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPrep();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchPrep is stable
  }, [jobId]);

  const handleGenerate = () => {
    setGenerating(true);
    fetch("/api/ai/interview-prep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: String(jobId) }),
    })
      .then((r) => {
        if (r.ok) setTimeout(fetchPrep, 3000);
        return r.json();
      })
      .then(() => setGenerating(false))
      .catch(() => setGenerating(false));
  };

  if (loading && !prep) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!prep && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              Get personalised interview questions for this role and questions to ask the interviewer.
            </p>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                "Prepare for Interview"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {prep && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Generated {new Date(prep.createdAt).toLocaleDateString()}
            </p>
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
              {generating ? "Regenerating…" : "Regenerate"}
            </Button>
          </div>

          <Card>
            <button
              type="button"
              className="w-full text-left"
              onClick={() => setExpectOpen((o) => !o)}
            >
              <CardHeader className="flex flex-row items-center justify-between hover:bg-muted/50 rounded-t-lg">
                <h2 className="text-lg font-semibold">
                  Questions to prepare for ({prep.expectQuestions.length})
                </h2>
                {expectOpen ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </CardHeader>
            </button>
            {expectOpen && (
              <CardContent className="pt-0 space-y-4">
                {prep.expectQuestions.map((q, i) => (
                  <div key={i} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <p className="font-medium">{q.question}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Why: {q.why}
                    </p>
                    <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-muted">
                      {q.category}
                    </span>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>

          <Card>
            <button
              type="button"
              className="w-full text-left"
              onClick={() => setAskOpen((o) => !o)}
            >
              <CardHeader className="flex flex-row items-center justify-between hover:bg-muted/50 rounded-t-lg">
                <h2 className="text-lg font-semibold">
                  Questions to ask the interviewer ({prep.askQuestions.length})
                </h2>
                {askOpen ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </CardHeader>
            </button>
            {askOpen && (
              <CardContent className="pt-0">
                <ul className="list-disc list-inside space-y-2">
                  {prep.askQuestions.map((q, i) => (
                    <li key={i}>{q.question}</li>
                  ))}
                </ul>
              </CardContent>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
