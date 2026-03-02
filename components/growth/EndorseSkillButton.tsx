"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface EndorseSkillButtonProps {
  recipientId: string;
  skill: string;
  alreadyEndorsed: boolean;
  onSuccess?: () => void;
}

export function EndorseSkillButton({
  recipientId,
  skill,
  alreadyEndorsed,
  onSuccess,
}: EndorseSkillButtonProps) {
  const [loading, setLoading] = useState(false);
  const [endorsed, setEndorsed] = useState(alreadyEndorsed);

  const handleClick = async () => {
    if (endorsed || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/growth/endorsements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, skill }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to endorse");
        return;
      }
      setEndorsed(true);
      onSuccess?.();
    } catch {
      toast.error("Failed to endorse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-xs h-7"
      disabled={endorsed || loading}
      onClick={handleClick}
    >
      {endorsed ? "Endorsed" : "Endorse"}
    </Button>
  );
}
