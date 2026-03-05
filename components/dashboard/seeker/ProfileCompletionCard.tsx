import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Eye, User } from "lucide-react";
import Link from "next/link";

interface ProfileViewInsight {
  companyName: string;
  count: number;
  lastViewedAt: Date;
  viewerRole?: string;
}

interface ProfileViewInsightsResult {
  totalViews: number;
  byCompany: ProfileViewInsight[];
  canSeeCompanyNames: boolean;
}

interface ProfileCompletionCardProps {
  completionScore: number;
  profileViews: number;
  headline?: string | null;
  profileViewInsights?: ProfileViewInsightsResult | null;
}

export function ProfileCompletionCard({
  completionScore,
  profileViews,
  headline,
  profileViewInsights,
}: ProfileCompletionCardProps) {
  const scoreColor =
    completionScore >= 80
      ? "text-green-500"
      : completionScore >= 50
        ? "text-amber-500"
        : "text-red-500";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <User className="h-4 w-4" /> Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-end justify-between mb-2">
            <span className="text-xs text-muted-foreground">Completion</span>
            <span className={`text-2xl font-bold ${scoreColor}`}>
              {completionScore}%
            </span>
          </div>
          <Progress value={completionScore} className="h-1.5" />
          {completionScore < 80 && (
            <Link
              href="/profile/edit"
              className="text-xs text-primary mt-2 block hover:underline"
            >
              Complete your profile →
            </Link>
          )}
        </div>

        <div className="pt-1 border-t border-border space-y-1">
          <div className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">{profileViews}</span>{" "}
              profile views
            </span>
          </div>
          {profileViewInsights?.canSeeCompanyNames && profileViewInsights.byCompany.length > 0 && (
            <div className="text-xs text-muted-foreground pl-6 space-y-0.5">
              {profileViewInsights.byCompany.slice(0, 3).map((c) => (
                <div key={c.companyName}>
                  {c.count} from {c.companyName}
                </div>
              ))}
            </div>
          )}
          {profileViewInsights && !profileViewInsights.canSeeCompanyNames && profileViews > 0 && (
            <Link
              href="/settings"
              className="text-xs text-primary pl-6 block hover:underline"
            >
              Upgrade to see who viewed
            </Link>
          )}
        </div>

        {headline && (
          <p className="text-xs text-muted-foreground truncate">{headline}</p>
        )}
      </CardContent>
    </Card>
  );
}
