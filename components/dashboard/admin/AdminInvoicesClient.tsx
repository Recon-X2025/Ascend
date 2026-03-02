"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function getFinancialYears(): string[] {
  const years: string[] = [];
  const now = new Date();
  for (let i = 0; i < 5; i++) {
    const y = now.getFullYear() - i;
    years.push(now.getMonth() >= 3 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`);
  }
  return Array.from(new Set(years)).sort().reverse();
}

function getCurrentFinancialYear(): string {
  const now = new Date();
  return now.getMonth() >= 3
    ? `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(2)}`
    : `${now.getFullYear() - 1}-${String(now.getFullYear()).slice(2)}`;
}

export function AdminInvoicesClient() {
  const [financialYear, setFinancialYear] = useState(getCurrentFinancialYear());
  const [type, setType] = useState("");
  const [userId, setUserId] = useState("");
  const [voidModal, setVoidModal] = useState<{ id: string; number: string } | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);

  const years = getFinancialYears();
  const params = new URLSearchParams();
  if (financialYear) params.set("financialYear", financialYear);
  if (type) params.set("type", type);
  if (userId) params.set("userId", userId);

  const { data, mutate } = useSWR(
    `/api/admin/invoices?${params.toString()}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const totals = data?.totals;
  const items = data?.items ?? [];

  const handleRegenerate = async (id: string) => {
    await fetch(`/api/invoices/${id}/regenerate`, { method: "POST" });
    mutate();
  };

  const handleVoid = async () => {
    if (!voidModal || !voidReason.trim()) return;
    setVoiding(true);
    try {
      await fetch(`/api/admin/invoices/${voidModal.id}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: voidReason }),
      });
      setVoidModal(null);
      setVoidReason("");
      mutate();
    } finally {
      setVoiding(false);
    }
  };

  const downloadCsv = () => {
    const csvParams = new URLSearchParams(params);
    csvParams.set("csv", "1");
    window.open(`/api/admin/invoices?${csvParams.toString()}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Revenue (excl GST)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{((totals?.totalRevenuePaise ?? 0) / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total GST</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{((totals?.totalGstPaise ?? 0) / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">CGST</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{((totals?.cgstPaise ?? 0) / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">SGST</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{((totals?.sgstPaise ?? 0) / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">IGST</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{((totals?.igstPaise ?? 0) / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Invoice list</CardTitle>
          <div className="flex gap-2">
            <Select value={financialYear || "all"} onValueChange={(v) => setFinancialYear(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="FY" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All FY</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={type || "all"} onValueChange={(v) => setType(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                <SelectItem value="MARKETPLACE_ORDER">Marketplace</SelectItem>
                <SelectItem value="MENTORSHIP_TRANCHE">Mentorship</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-[180px]"
            />
            <Button variant="outline" size="sm" onClick={downloadCsv}>
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Invoice</th>
                    <th className="text-left py-2">User</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-right py-2">Subtotal</th>
                    <th className="text-right py-2">GST</th>
                    <th className="text-right py-2">Total</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((inv: { id: string; invoiceNumber: string; user?: { name?: string; email?: string }; paymentType: string; subtotalPaise: number; cgstPaise: number; sgstPaise: number; igstPaise: number; totalPaise: number; status: string; pdfS3Key?: string | null }) => (
                    <tr key={inv.id} className="border-b">
                      <td className="py-2">{inv.invoiceNumber}</td>
                      <td className="py-2">{inv.user?.name ?? inv.user?.email ?? inv.id.slice(0, 8)}</td>
                      <td className="py-2">{inv.paymentType}</td>
                      <td className="text-right py-2">₹{(inv.subtotalPaise / 100).toFixed(2)}</td>
                      <td className="text-right py-2">₹{((inv.cgstPaise + inv.sgstPaise + inv.igstPaise) / 100).toFixed(2)}</td>
                      <td className="text-right py-2 font-medium">₹{(inv.totalPaise / 100).toFixed(2)}</td>
                      <td className="py-2">
                        <Badge variant={inv.status === "FINALISED" ? "default" : inv.status === "VOID" ? "destructive" : "secondary"}>
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="py-2 space-x-1">
                        {inv.status === "DRAFT" && (
                          <Button size="sm" variant="outline" onClick={() => handleRegenerate(inv.id)}>
                            Regenerate
                          </Button>
                        )}
                        {inv.status !== "VOID" && (
                          <Button size="sm" variant="destructive" onClick={() => setVoidModal({ id: inv.id, number: inv.invoiceNumber })}>
                            Void
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!voidModal} onOpenChange={() => !voiding && setVoidModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void invoice</DialogTitle>
            <DialogDescription>
              Voiding invoice {voidModal?.number} is irreversible. Enter a reason for the void.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="voidReason">Reason</Label>
            <Input
              id="voidReason"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="e.g. Full refund processed"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidModal(null)} disabled={voiding}>Cancel</Button>
            <Button variant="destructive" onClick={handleVoid} disabled={!voidReason.trim() || voiding}>
              {voiding ? "Voiding..." : "Void invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
