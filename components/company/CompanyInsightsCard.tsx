import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface CompanyInsightData {
  totalJDsIndexed: number;
  activeRoleCount: number;
  topRoles: { title: string; count: number; seniority: string | null }[];
  topSkills: { skill: string; count: number }[];
  topLocations: { city: string; count: number }[];
  primaryLocation: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryMedian: number | null;
  salaryDisclosureRate: number;
  juniorPct: number;
  midPct: number;
  seniorPct: number;
  managerPct: number;
  hiringVelocity: string | null;
  industries: { industry: string; count: number }[];
  lastComputedAt: string;
}

interface CompanyInsightsCardProps {
  insight: CompanyInsightData;
}

export function CompanyInsightsCard({ insight }: CompanyInsightsCardProps) {
  const formatSalary = (n: number) => `₹${(n / 100000).toFixed(0)}L`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          Hiring Insights
          <Badge variant="secondary" className="text-xs font-normal">
            Based on {insight.totalJDsIndexed} indexed job description
            {insight.totalJDsIndexed === 1 ? "" : "s"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">Active roles</p>
            <p className="font-semibold">{insight.activeRoleCount}</p>
          </div>
          {insight.primaryLocation && (
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Primary location</p>
              <p className="font-semibold">{insight.primaryLocation}</p>
            </div>
          )}
          {insight.hiringVelocity && (
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Hiring activity</p>
              <Badge
                variant={insight.hiringVelocity === "high" ? "default" : "secondary"}
                className="capitalize"
              >
                {insight.hiringVelocity}
              </Badge>
            </div>
          )}
        </div>

        {insight.salaryMin != null && insight.salaryMax != null && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Salary range (from disclosed JDs —{" "}
              {Math.round(insight.salaryDisclosureRate * 100)}% disclosure rate)
            </p>
            <p className="text-sm font-medium">
              {formatSalary(insight.salaryMin)} – {formatSalary(insight.salaryMax)} per
              year
              {insight.salaryMedian != null && (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  · median {formatSalary(insight.salaryMedian)}
                </span>
              )}
            </p>
          </div>
        )}

        {insight.topSkills.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Commonly required skills</p>
            <div className="flex flex-wrap gap-1.5">
              {insight.topSkills.slice(0, 8).map(({ skill }) => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {(insight.juniorPct + insight.midPct + insight.seniorPct + insight.managerPct) >
          0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Seniority mix</p>
            <div className="flex gap-3 text-xs">
              {insight.juniorPct > 0 && (
                <span>Junior {Math.round(insight.juniorPct * 100)}%</span>
              )}
              {insight.midPct > 0 && <span>Mid {Math.round(insight.midPct * 100)}%</span>}
              {insight.seniorPct > 0 && (
                <span>Senior {Math.round(insight.seniorPct * 100)}%</span>
              )}
              {insight.managerPct > 0 && (
                <span>Manager {Math.round(insight.managerPct * 100)}%</span>
              )}
            </div>
          </div>
        )}

        {insight.topRoles.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Most hired roles</p>
            <div className="space-y-1">
              {insight.topRoles.slice(0, 4).map(({ title, count }) => (
                <div key={title} className="flex justify-between text-xs">
                  <span className="text-foreground">{title}</span>
                  <span className="text-muted-foreground">{count} JDs</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground pt-1">
          Data derived from indexed job descriptions · Updated{" "}
          {new Date(insight.lastComputedAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
