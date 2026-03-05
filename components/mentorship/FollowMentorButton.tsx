"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";

interface FollowMentorButtonProps {
  mentorUserId: string;
  initialFollowing: boolean;
  onToggle?: (following: boolean) => void;
}

export function FollowMentorButton({
  mentorUserId,
  initialFollowing,
  onToggle,
}: FollowMentorButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (following) {
        const res = await fetch(`/api/mentorship/follow/${mentorUserId}`, { method: "DELETE" });
        if (res.ok) {
          setFollowing(false);
          onToggle?.(false);
        }
      } else {
        const res = await fetch("/api/mentorship/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mentorUserId }),
        });
        if (res.ok) {
          setFollowing(true);
          onToggle?.(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={following ? "outline" : "default"}
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="gap-1.5"
    >
      {following ? (
        <>
          <UserMinus className="h-3.5 w-3.5" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="h-3.5 w-3.5" />
          Follow
        </>
      )}
    </Button>
  );
}
