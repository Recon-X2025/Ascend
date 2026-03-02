import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import Image from "next/image";

const STATUS_STYLES: Record<string, string> = {
  SUBMITTED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  UNDER_REVIEW: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  SHORTLISTED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  INTERVIEW_SCHEDULED: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  OFFERED: "bg-green-500/10 text-green-400 border-green-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
  WITHDRAWN: "bg-muted text-muted-foreground border-border",
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

interface AppItem {
  id: string;
  status: string;
  createdAt: string;
  jobPost: {
    id: number;
    title: string;
    slug: string;
    company: { name: string; logo: string | null };
  };
}

export function RecentApplicationsList({
  applications,
}: {
  applications: AppItem[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Recent Applications
          </CardTitle>
          <Link
            href="/dashboard/seeker/applications"
            className="text-xs text-primary hover:underline"
          >
            View all →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {applications.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">No applications yet.</p>
            <Link
              href="/jobs"
              className="text-sm text-primary hover:underline mt-1 block"
            >
              Browse open roles →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {applications.map((app) => (
              <div
                key={app.id}
                className="flex items-center gap-3 px-6 py-3 hover:bg-muted/30 transition-colors"
              >
                {app.jobPost.company.logo ? (
                  <div className="hidden sm:block shrink-0">
                    <Image
                      src={app.jobPost.company.logo}
                      alt=""
                      width={32}
                      height={32}
                      className="rounded-md object-contain"
                    />
                  </div>
                ) : (
                  <div className="hidden sm:flex w-8 h-8 rounded-md bg-muted items-center justify-center shrink-0 text-xs font-bold">
                    {app.jobPost.company.name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/jobs/${app.jobPost.slug}`}
                    className="text-sm font-medium hover:text-primary truncate block"
                  >
                    {app.jobPost.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {app.jobPost.company.name}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2 py-0 ${
                      STATUS_STYLES[app.status] ?? ""
                    }`}
                  >
                    {formatStatus(app.status)}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(app.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
