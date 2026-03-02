"use client";

import { useState } from "react";
import useSWR from "swr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ProviderRow = {
  id: string;
  userId: string;
  type: string;
  status: string;
  bio: string;
  specialisations: string[];
  languages: string[];
  pricePerSession: number;
  currency: string;
  turnaroundHours: number | null;
  calendarUrl: string | null;
  adminNote: string | null;
  createdAt: string;
  daysWaiting: number;
  user: { id: string; name: string | null; email: string; image: string | null };
};

export default function AdminMarketplaceProvidersPage() {
  const [tab, setTab] = useState("PENDING_REVIEW");
  const [selected, setSelected] = useState<ProviderRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [actioning, setActioning] = useState(false);

  const { data, mutate } = useSWR<{ items: ProviderRow[]; total: number }>(
    `/api/admin/marketplace/providers?status=${tab}`,
    fetcher
  );
  const items = data?.items ?? [];

  const handleApprove = async (id: string) => {
    setActioning(true);
    try {
      const res = await fetch(`/api/admin/marketplace/providers/${id}/approve`, { method: "POST" });
      if (res.ok) {
        setSheetOpen(false);
        setSelected(null);
        mutate();
      }
    } finally {
      setActioning(false);
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    setActioning(true);
    try {
      const res = await fetch(`/api/admin/marketplace/providers/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        setSheetOpen(false);
        setSelected(null);
        mutate();
      }
    } finally {
      setActioning(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Marketplace providers</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="PENDING_REVIEW">Pending</TabsTrigger>
          <TabsTrigger value="ACTIVE">Active</TabsTrigger>
          <TabsTrigger value="SUSPENDED">Suspended</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {items.length === 0 ? (
            <p className="text-muted-foreground">No providers in this tab.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((row) => (
                <li
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelected(row);
                    setSheetOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(row);
                      setSheetOpen(true);
                    }
                  }}
                  className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {(row.user?.name ?? "?")[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{row.user?.name ?? row.user?.email ?? "—"}</p>
                    <p className="text-sm text-muted-foreground">{row.type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {row.daysWaiting} days waiting · {row.currency} {row.pricePerSession}
                    </p>
                  </div>
                  <Badge variant={row.status === "ACTIVE" ? "default" : "secondary"}>{row.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selected?.user?.name ?? selected?.user?.email ?? "Provider"}</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">{selected.user?.email}</p>
              <p className="text-sm"><strong>Type:</strong> {selected.type.replace(/_/g, " ")}</p>
              <p className="text-sm"><strong>Bio:</strong></p>
              <p className="text-sm whitespace-pre-wrap">{selected.bio}</p>
              <p className="text-sm"><strong>Specialisations:</strong> {selected.specialisations?.join(", ")}</p>
              <p className="text-sm"><strong>Languages:</strong> {selected.languages?.join(", ")}</p>
              <p className="text-sm"><strong>Price:</strong> {selected.currency} {selected.pricePerSession}</p>
              {selected.turnaroundHours != null && (
                <p className="text-sm"><strong>Turnaround:</strong> {selected.turnaroundHours}h</p>
              )}
              {selected.calendarUrl && (
                <p className="text-sm"><strong>Calendar:</strong> <a href={selected.calendarUrl} target="_blank" rel="noreferrer" className="text-primary underline">{selected.calendarUrl}</a></p>
              )}
              {selected.adminNote && (
                <p className="text-sm"><strong>Admin note:</strong> {selected.adminNote}</p>
              )}
              {tab === "PENDING_REVIEW" && (
                <div className="flex gap-2 pt-4">
                  <Button onClick={() => handleApprove(selected.id)} disabled={actioning}>
                    Approve
                  </Button>
                  <Button variant="destructive" onClick={() => handleReject(selected.id)} disabled={actioning}>
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
