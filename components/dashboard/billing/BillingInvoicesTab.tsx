"use client";

import { useState, useEffect } from "react";
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

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  description: string;
  totalPaise: number;
  status: string;
  pdfReady: boolean;
}

interface InvoicesResponse {
  items: InvoiceItem[];
  total: number;
  page: number;
  limit: number;
}

function getFinancialYears(): string[] {
  const years: string[] = [];
  const now = new Date();
  for (let i = 0; i < 5; i++) {
    const y = now.getFullYear() - i;
    years.push(now.getMonth() >= 3 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`);
  }
  return Array.from(new Set(years)).sort().reverse();
}

export function BillingInvoicesTab() {
  const [data, setData] = useState<InvoicesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [financialYear, setFinancialYear] = useState<string>("");
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (financialYear) params.set("financialYear", financialYear);
    fetch(`/api/invoices?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [financialYear]);

  const handleDownload = async (id: string) => {
    setDownloading(id);
    try {
      const res = await fetch(`/api/invoices/${id}/download`);
      const { url } = await res.json();
      if (url) window.open(url, "_blank");
    } finally {
      setDownloading(null);
    }
  };

  const years = getFinancialYears();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Invoices</CardTitle>
        <Select value={financialYear || "all"} onValueChange={(v) => setFinancialYear(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Financial year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All years</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !data?.items?.length ? (
          <p className="text-sm text-muted-foreground">No invoices yet.</p>
        ) : (
          <ul className="space-y-3">
            {data.items.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <span className="font-medium">{inv.invoiceNumber}</span>
                  <span className="mx-2 text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(inv.invoiceDate).toLocaleDateString()}
                  </span>
                  <p className="text-sm text-muted-foreground truncate max-w-md">{inv.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">₹{(inv.totalPaise / 100).toFixed(2)}</span>
                  <Badge variant={inv.status === "FINALISED" ? "default" : inv.status === "VOID" ? "destructive" : "secondary"}>
                    {inv.status}
                  </Badge>
                  {inv.pdfReady && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(inv.id)}
                      disabled={!!downloading}
                    >
                      {downloading === inv.id ? "..." : "Download PDF"}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
