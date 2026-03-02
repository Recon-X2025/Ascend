"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Subscription {
  id: string;
  userId: string;
  plan: string;
  planKey: string | null;
  status: string;
  expiresAt: Date | null;
  user: { id: string; email: string | null; name: string | null };
}

export default function AdminSubscriptionsPage() {
  const [data, setData] = useState<{
    subscriptions: Subscription[];
    summary: { plan: string; count: number }[];
  } | null>(null);
  const [overrideSubId, setOverrideSubId] = useState<string | null>(null);
  const [overridePlanKey, setOverridePlanKey] = useState("");
  const [overrideExpiresAt, setOverrideExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/subscriptions")
      .then((r) => r.json())
      .then(setData);
  }, []);

  const handleOverride = async () => {
    if (!overrideSubId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/${overrideSubId}/override`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey: overridePlanKey,
          expiresAt: overrideExpiresAt || undefined,
        }),
      });
      if (res.ok) {
        setOverrideSubId(null);
        const d = await fetch("/api/admin/subscriptions").then((r) => r.json());
        setData(d);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!data) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Subscriptions</h1>
      <div className="grid gap-4 md:grid-cols-4">
        {data.summary.map((s) => (
          <Card key={s.plan}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{s.plan}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Active subscriptions</CardTitle>
          <p className="text-sm text-muted-foreground">Manual override: select a row and set plan + expiresAt.</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <span className="font-medium">{sub.user.name ?? sub.user.email ?? sub.userId}</span>
                    <br />
                    <span className="text-xs text-muted-foreground">{sub.user.email}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{sub.planKey ?? sub.plan}</Badge>
                  </TableCell>
                  <TableCell>{sub.status}</TableCell>
                  <TableCell>
                    {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOverrideSubId(sub.id);
                        setOverridePlanKey(sub.planKey ?? sub.plan);
                        setOverrideExpiresAt(
                          sub.expiresAt ? new Date(sub.expiresAt).toISOString().slice(0, 16) : ""
                        );
                      }}
                    >
                      Override
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {overrideSubId && (
            <div className="mt-6 flex flex-wrap items-end gap-4 rounded-lg border p-4">
              <div>
                <Label>Plan key</Label>
                <Select value={overridePlanKey} onValueChange={setOverridePlanKey}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEEKER_FREE">SEEKER_FREE</SelectItem>
                    <SelectItem value="SEEKER_PAID">SEEKER_PAID</SelectItem>
                    <SelectItem value="MENTOR_FREE">MENTOR_FREE</SelectItem>
                    <SelectItem value="MENTOR_PAID">MENTOR_PAID</SelectItem>
                    <SelectItem value="MENTOR_MARKETPLACE">MENTOR_MARKETPLACE</SelectItem>
                    <SelectItem value="RECRUITER_FREE">RECRUITER_FREE</SelectItem>
                    <SelectItem value="RECRUITER_STARTER">RECRUITER_STARTER</SelectItem>
                    <SelectItem value="RECRUITER_PRO">RECRUITER_PRO</SelectItem>
                    <SelectItem value="RECRUITER_ENTERPRISE">RECRUITER_ENTERPRISE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Expires at</Label>
                <Input
                  type="datetime-local"
                  value={overrideExpiresAt}
                  onChange={(e) => setOverrideExpiresAt(e.target.value)}
                  className="w-48"
                />
              </div>
              <Button onClick={handleOverride} disabled={saving}>
                {saving ? "Saving…" : "Apply"}
              </Button>
              <Button variant="ghost" onClick={() => setOverrideSubId(null)}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
