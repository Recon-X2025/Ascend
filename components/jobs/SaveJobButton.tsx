"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function SaveJobButton({ jobId, initialSaved }: { jobId: number; initialSaved?: boolean }) {
  const [saved, setSaved] = useState(!!initialSaved);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    const next = !saved;
    setSaved(next);
    try {
      const res = await fetch(`/api/jobs/${jobId}/save`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setSaved(!next);
      else if (data.saved !== undefined) setSaved(data.saved);
    } catch {
      setSaved(!next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={cn(
        "p-2 rounded-md hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center",
        saved && "text-red-500"
      )}
      aria-label={saved ? "Unsave job" : "Save job"}
    >
      <Heart className={cn("h-5 w-5", saved && "fill-current")} />
    </button>
  );
}
