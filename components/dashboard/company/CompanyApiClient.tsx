"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function CompanyApiClient() {
  const [tab, setTab] = useState("keys");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink">API & Integrations</h1>
      <p className="text-ink-2">
        Manage API keys, view usage, configure webhooks and ATS. Enterprise plan required.
      </p>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="ats">ATS Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <p className="text-sm text-ink-3">
                Create keys to access the REST API. Keys are shown once only.
              </p>
            </CardHeader>
            <CardContent>
              <Button disabled>Create key (Enterprise required)</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage</CardTitle>
              <p className="text-sm text-ink-3">
                Requests in the last 7 and 30 days.
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-ink-3">No usage data yet.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
              <p className="text-sm text-ink-3">
                Configure outbound webhook endpoints.
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-ink-3">No webhooks configured.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ats" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>ATS Integration</CardTitle>
              <p className="text-sm text-ink-3">
                Receive webhooks from Greenhouse, Lever, Workday.
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-ink-3">
                Webhook URL: <code className="text-xs">https://ascend.app/api/webhooks/ats/greenhouse</code>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
