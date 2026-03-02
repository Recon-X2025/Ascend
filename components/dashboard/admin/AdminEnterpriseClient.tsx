"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function AdminEnterpriseClient() {
  const { data } = useSWR("/api/admin/enterprise", fetcher);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink">Enterprise</h1>
      <p className="text-ink-2">
        Manage Enterprise companies: API usage, ATS integrations, SSO activation.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Enterprise companies</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.data?.length ? (
            <ul className="space-y-2">
              {data.data.map((c: { id: string; name: string }) => (
                <li key={c.id} className="text-sm">
                  {c.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-3">No Enterprise companies.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
