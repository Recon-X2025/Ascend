"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type CompanyRow = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  industry: string | null;
  verified: boolean;
  suspendedAt: string | null;
  suspensionReason: string | null;
  createdAt: string;
  jobCount: number;
  reviewCount: number;
};

const FILTERS = [
  { verified: "", suspended: "", label: "All" },
  { verified: "true", suspended: "", label: "Verified" },
  { verified: "false", suspended: "", label: "Unverified" },
  { verified: "", suspended: "true", label: "Suspended" },
];

function buildUrl(params: {
  search: string;
  verified: string;
  suspended: string;
  cursor: string;
}) {
  const u = new URLSearchParams();
  if (params.search) u.set("search", params.search);
  if (params.verified) u.set("verified", params.verified);
  if (params.suspended) u.set("suspended", params.suspended);
  if (params.cursor) u.set("cursor", params.cursor);
  return `/api/admin/companies?${u.toString()}`;
}

export function AdminCompaniesClient() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [verified, setVerified] = useState("");
  const [suspended, setSuspended] = useState("");
  const [cursor, setCursor] = useState("");
  const [suspendCompany, setSuspendCompany] = useState<CompanyRow | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [verifyCompany, setVerifyCompany] = useState<CompanyRow | null>(null);
  const [unverifyCompany, setUnverifyCompany] = useState<CompanyRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setCursor("");
  }, [debouncedSearch, verified, suspended]);

  const url = buildUrl({
    search: debouncedSearch,
    verified,
    suspended,
    cursor,
  });
  const { data, mutate } = useSWR<{
    companies: CompanyRow[];
    nextCursor: string | null;
    hasMore: boolean;
  }>(url, fetcher);

  const [allCompanies, setAllCompanies] = useState<CompanyRow[]>([]);
  useEffect(() => {
    if (!data?.companies) return;
    if (!cursor) setAllCompanies(data.companies);
    else setAllCompanies((prev) => [...prev, ...data.companies]);
  }, [data?.companies, cursor]);
  const displayCompanies = cursor ? allCompanies : (data?.companies ?? []);

  const handleSuspend = async () => {
    if (!suspendCompany || !suspendReason.trim()) return;
    const res = await fetch(`/api/admin/companies/${suspendCompany.id}/suspend`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: suspendReason.trim() }),
    });
    if (res.ok) {
      setSuspendCompany(null);
      setSuspendReason("");
      mutate();
    } else {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? "Failed to suspend");
    }
  };

  const handleUnsuspend = async (company: CompanyRow) => {
    const res = await fetch(`/api/admin/companies/${company.id}/unsuspend`, {
      method: "PATCH",
    });
    if (res.ok) mutate();
    else alert((await res.json().catch(() => ({}))).error ?? "Failed to unsuspend");
  };

  const handleVerify = async (company: CompanyRow) => {
    const res = await fetch(`/api/admin/companies/${company.id}/verify`, {
      method: "PATCH",
    });
    if (res.ok) {
      setVerifyCompany(null);
      mutate();
    } else alert((await res.json().catch(() => ({}))).error ?? "Failed");
  };

  const handleUnverify = async (company: CompanyRow) => {
    const res = await fetch(`/api/admin/companies/${company.id}/unverify`, {
      method: "PATCH",
    });
    if (res.ok) {
      setUnverifyCompany(null);
      mutate();
    } else alert((await res.json().catch(() => ({}))).error ?? "Failed");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Companies</h1>

      <div className="flex flex-wrap gap-4 items-center">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <Button
              key={f.label}
              variant={
                verified === f.verified && suspended === f.suspended
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() => {
                setVerified(f.verified);
                setSuspended(f.suspended);
              }}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">Company</th>
              <th className="text-left p-3">Industry</th>
              <th className="text-left p-3">Verified</th>
              <th className="text-left p-3">Jobs</th>
              <th className="text-left p-3">Reviews</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayCompanies.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">
                  <a
                    href={`/companies/${c.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:underline"
                  >
                    {c.logo ? (
                      <Image
                        src={c.logo}
                        alt=""
                        width={32}
                        height={32}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs font-medium">
                        {c.name.slice(0, 1)}
                      </div>
                    )}
                    <span className="font-medium">{c.name}</span>
                  </a>
                </td>
                <td className="p-3 text-muted-foreground">{c.industry ?? "—"}</td>
                <td className="p-3">
                  {c.verified ? (
                    <Badge variant="default">Verified</Badge>
                  ) : (
                    <Badge variant="outline">Unverified</Badge>
                  )}
                </td>
                <td className="p-3">{c.jobCount}</td>
                <td className="p-3">{c.reviewCount}</td>
                <td className="p-3">
                  {c.suspendedAt ? (
                    <Badge variant="destructive">Suspended</Badge>
                  ) : (
                    <Badge variant="outline">Active</Badge>
                  )}
                </td>
                <td className="p-3 text-right">
                  {c.verified ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUnverifyCompany(c)}
                    >
                      Unverify
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVerifyCompany(c)}
                    >
                      Verify
                    </Button>
                  )}
                  {c.suspendedAt ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-1"
                      onClick={() => handleUnsuspend(c)}
                    >
                      Unsuspend
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="ml-1"
                      onClick={() => setSuspendCompany(c)}
                    >
                      Suspend
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!displayCompanies.length && (
          <div className="p-8 text-center text-muted-foreground">
            No companies found.
          </div>
        )}
      </div>

      {data?.hasMore && (
        <Button
          variant="outline"
          onClick={() => data?.nextCursor && setCursor(data.nextCursor)}
        >
          Load more
        </Button>
      )}

      <Dialog
        open={!!suspendCompany}
        onOpenChange={(o) => !o && setSuspendCompany(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend company</DialogTitle>
          </DialogHeader>
          {suspendCompany && (
            <>
              <p className="text-sm text-muted-foreground">
                Suspending <strong>{suspendCompany.name}</strong>. Active jobs
                will be paused.
              </p>
              <div>
                <Label htmlFor="suspend-reason">Reason (required)</Label>
                <textarea
                  id="suspend-reason"
                  className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Reason for suspension..."
                />
              </div>
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendCompany(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={!suspendCompany || !suspendReason.trim()}
            >
              Suspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!verifyCompany}
        onOpenChange={(o) => !o && setVerifyCompany(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify company?</AlertDialogTitle>
            <AlertDialogDescription>
              {verifyCompany?.name} will be marked as verified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => verifyCompany && handleVerify(verifyCompany)}>
              Verify
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!unverifyCompany}
        onOpenChange={(o) => !o && setUnverifyCompany(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove verification?</AlertDialogTitle>
            <AlertDialogDescription>
              {unverifyCompany?.name} will be marked as unverified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                unverifyCompany && handleUnverify(unverifyCompany)
              }
            >
              Unverify
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
