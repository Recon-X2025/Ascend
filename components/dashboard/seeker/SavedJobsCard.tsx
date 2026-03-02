import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface JobItem {
  id: number;
  title: string;
  slug: string;
  status: string;
  company: { name: string };
}

export function SavedJobsCard({ jobs }: { jobs: JobItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Bookmark className="h-3.5 w-3.5" /> Saved Jobs
          </CardTitle>
          <Link
            href="/jobs"
            className="text-xs text-primary hover:underline"
          >
            View all →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-3">
        {jobs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No saved jobs yet.
          </p>
        ) : (
          jobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.slug}`}
              className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{job.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {job.company.name}
                </p>
              </div>
              {job.status === "CLOSED" && (
                <Badge
                  variant="outline"
                  className="text-[9px] px-1.5 py-0 text-muted-foreground shrink-0"
                >
                  Closed
                </Badge>
              )}
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
