"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface HelpfulVoteProps {
  reviewId: string;
  reviewType: "company" | "interview";
  helpfulCount: number;
  unhelpfulCount: number;
  onVote?: (helpful: boolean) => void;
}

export function HelpfulVote({
  reviewId,
  reviewType,
  helpfulCount,
  unhelpfulCount,
  onVote,
}: HelpfulVoteProps) {
  const [loading, setLoading] = useState(false);
  const [localHelpful, setLocalHelpful] = useState(helpfulCount);
  const [localUnhelpful, setLocalUnhelpful] = useState(unhelpfulCount);
  const [voted, setVoted] = useState<boolean | null>(null);

  const handleVote = async (helpful: boolean) => {
    if (voted !== null) return;
    setLoading(true);
    try {
      const url =
        reviewType === "company"
          ? `/api/reviews/company/${reviewId}/vote`
          : `/api/reviews/interview/${reviewId}/vote`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ helpful }),
      });
      const json = await res.json();
      if (res.ok) {
        setVoted(helpful);
        setLocalHelpful(json.helpfulCount ?? localHelpful);
        setLocalUnhelpful(json.unhelpfulCount ?? localUnhelpful);
        onVote?.(helpful);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground">
        {localHelpful + localUnhelpful > 0
          ? `${localHelpful} people found this helpful`
          : "Was this helpful?"}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={loading || voted === true}
        onClick={() => handleVote(true)}
      >
        Helpful
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={loading || voted === false}
        onClick={() => handleVote(false)}
      >
        Not helpful
      </Button>
    </div>
  );
}
