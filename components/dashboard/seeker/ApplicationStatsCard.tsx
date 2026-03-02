import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase } from "lucide-react";
import Link from "next/link";

interface Stats {
  total: number;
  applied: number;
  viewed: number;
  shortlisted: number;
  interview: number;
  offered: number;
  rejected: number;
}

const STAGES = [
  { key: "applied" as const, label: "Applied", color: "bg-blue-500/15 text-blue-400" },
  { key: "viewed" as const, label: "Viewed", color: "bg-purple-500/15 text-purple-400" },
  { key: "shortlisted" as const, label: "Shortlisted", color: "bg-amber-500/15 text-amber-400" },
  { key: "interview" as const, label: "Interview", color: "bg-indigo-500/15 text-indigo-400" },
  { key: "offered" as const, label: "Offered", color: "bg-green-500/15 text-green-400" },
  { key: "rejected" as const, label: "Rejected", color: "bg-red-500/15 text-red-400" },
];

export function ApplicationStatsCard({ stats }: { stats?: Stats }) {
  const s = stats ?? {
    total: 0,
    applied: 0,
    viewed: 0,
    shortlisted: 0,
    interview: 0,
    offered: 0,
    rejected: 0,
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Briefcase className="h-4 w-4" /> Applications
          </CardTitle>
          <Link
            href="/dashboard/seeker/applications"
            className="text-xs text-primary hover:underline"
          >
            View all →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <span className="text-3xl font-bold">{s.total}</span>
          <span className="text-muted-foreground text-sm ml-2">total</span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
          {STAGES.map(({ key, label, color }) => (
            <div key={key} className={`rounded-lg px-3 py-2 min-w-0 ${color}`}>
              <div className="text-lg font-bold">{s[key]}</div>
              <div className="text-xs opacity-80">{label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
