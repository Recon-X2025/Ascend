"use client";

import { useState } from "react";

export function ReportJobButton({ jobId }: { jobId: number }) {
  const [sent, setSent] = useState(false);

  const report = async () => {
    if (sent) return;
    const res = await fetch(`/api/jobs/${jobId}/report`, { method: "POST" });
    if (res.ok) setSent(true);
  };

  return (
    <button
      type="button"
      onClick={report}
      className="text-xs text-muted-foreground hover:underline"
    >
      {sent ? "Report submitted" : "Report job"}
    </button>
  );
}
