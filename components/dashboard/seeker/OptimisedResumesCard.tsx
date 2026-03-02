import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface ResumeItem {
  id: string;
  name: string;
  createdAt: string;
  jobPost: { title: string; slug: string } | null;
}

export function OptimisedResumesCard({ resumes }: { resumes: ResumeItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" /> Recently Optimised Resumes
          </CardTitle>
          <Link
            href="/resume/versions"
            className="text-xs text-primary hover:underline"
          >
            View all →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {resumes.map((r) => (
            <Link
              key={r.id}
              href="/resume/versions"
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-all group"
            >
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{r.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {r.jobPost?.title ?? "Untitled role"} ·{" "}
                  {formatDistanceToNow(new Date(r.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
