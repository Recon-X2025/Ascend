import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";
import Link from "next/link";

interface AlertItem {
  id: string;
  keywords: string;
  query?: string;
  location?: string | null;
  frequency: string;
}

export function AlertsCard({ alerts }: { alerts: AlertItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Bell className="h-3.5 w-3.5" /> Job Alerts
          </CardTitle>
          <Link
            href="/settings/job-alerts"
            className="text-xs text-primary hover:underline"
          >
            Manage →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {alerts.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">No active alerts.</p>
            <Link
              href="/settings/job-alerts"
              className="text-xs text-primary hover:underline mt-1 block"
            >
              Create an alert →
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="text-xs bg-muted/40 rounded-lg px-3 py-2"
              >
                <p className="font-medium truncate">{alert.keywords}</p>
                <p className="text-muted-foreground text-[10px]">
                  {alert.location ?? "Any location"} ·{" "}
                  {alert.frequency?.toLowerCase()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
