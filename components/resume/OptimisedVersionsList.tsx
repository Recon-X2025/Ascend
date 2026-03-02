"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink } from "lucide-react";

interface OptimisedVersionItem {
  id: string;
  name: string;
  createdAt: string;
  jobPost: {
    id: number;
    title: string;
    slug: string;
    companyName: string | null;
  } | null;
}

export function OptimisedVersionsList() {
  const [versions, setVersions] = useState<OptimisedVersionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/resume/optimised-versions")
      .then((r) => r.json())
      .then((data) => setVersions(data?.versions ?? []))
      .catch(() => setVersions([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (versions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No optimised resumes yet. Open a job listing and click &quot;Optimise
        Resume for This Job&quot;.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {versions.map((v) => (
        <Card key={v.id}>
          <CardContent className="pt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">{v.name}</p>
                {v.jobPost && (
                  <p className="text-xs text-muted-foreground">
                    {v.jobPost.companyName ?? "Company"} · {v.jobPost.title}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="secondary" className="text-xs">
                Optimised
              </Badge>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/resume/versions`}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
