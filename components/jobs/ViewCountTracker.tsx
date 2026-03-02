"use client";

import { useEffect } from "react";

export function ViewCountTracker({ jobId }: { jobId: number }) {
  useEffect(() => {
    fetch(`/api/jobs/${jobId}/view`, { method: "POST" }).catch(() => {});
  }, [jobId]);
  return null;
}
