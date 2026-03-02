"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpfulVote } from "./HelpfulVote";

interface InterviewReviewCardProps {
  id: string;
  headline: string;
  jobTitle: string;
  interviewYear: number | null;
  interviewResult: string | null;
  difficulty: string;
  experience: string;
  overallRating: number;
  processDesc: string;
  questions: string | null;
  tips: string | null;
  helpfulCount: number;
  unhelpfulCount: number;
  createdAt: string;
}

const RESULT_LABELS: Record<string, string> = {
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDREW: "Withdrew",
  PENDING: "Pending",
};

export function InterviewReviewCard({
  id,
  headline,
  jobTitle,
  interviewYear,
  interviewResult,
  difficulty,
  experience,
  overallRating,
  processDesc,
  questions,
  tips,
  helpfulCount,
  unhelpfulCount,
  createdAt,
}: InterviewReviewCardProps) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <h3 className="font-semibold text-lg">{headline || "Interview experience"}</h3>
        <div className="flex flex-wrap items-center gap-2">
          {interviewResult && (
            <Badge variant="default">{RESULT_LABELS[interviewResult] ?? interviewResult}</Badge>
          )}
          <Badge variant="secondary">{difficulty.replace("_", " ")}</Badge>
          {experience && (
            <Badge variant="outline">{experience.charAt(0) + experience.slice(1).toLowerCase()}</Badge>
          )}
          {createdAt && (
            <span className="text-sm text-muted-foreground">
              {new Date(createdAt).toLocaleDateString()}
            </span>
          )}
          {interviewYear && <span className="text-sm text-muted-foreground">{interviewYear}</span>}
          <span className="text-sm text-muted-foreground">{jobTitle}</span>
          <span className="text-primary text-sm">{"★".repeat(Math.round(overallRating))}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Process</p>
          <p className="text-sm mt-1">{processDesc}</p>
        </div>
        {questions && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Sample questions</p>
            <p className="text-sm mt-1 whitespace-pre-wrap">{questions}</p>
          </div>
        )}
        {tips && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tips for candidates</p>
            <p className="text-sm mt-1">{tips}</p>
          </div>
        )}
        <HelpfulVote
          reviewId={id}
          reviewType="interview"
          helpfulCount={helpfulCount}
          unhelpfulCount={unhelpfulCount}
        />
      </CardContent>
    </Card>
  );
}
