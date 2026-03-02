import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Eye, User } from "lucide-react";
import Link from "next/link";

interface ProfileCompletionCardProps {
  completionScore: number;
  profileViews: number;
  headline?: string | null;
}

export function ProfileCompletionCard({
  completionScore,
  profileViews,
  headline,
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

        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">{profileViews}</span>{" "}
            profile views
          </span>
        </div>

        {headline && (
          <p className="text-xs text-muted-foreground truncate">{headline}</p>
        )}
      </CardContent>
    </Card>
  );
}
