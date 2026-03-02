"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import toast from "react-hot-toast";

type DataRequestItem = {
  id: string;
  type: string;
  status: string;
  requestedAt: string;
  completedAt: string | null;
  exportUrl: string | null;
};

export function YourDataSection() {
  const [requests, setRequests] = useState<DataRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchRequests = async () => {
    const res = await fetch("/api/user/data-request");
    if (!res.ok) return;
    const json = await res.json();
    if (json.data) setRequests(json.data);
  };

  useEffect(() => {
    (async () => {
      await fetchRequests();
      setLoading(false);
    })();
  }, []);

  const hasPendingExport = requests.some(
    (r) => r.type === "EXPORT" && (r.status === "PENDING" || r.status === "PROCESSING")
  );
  const hasPendingDelete = requests.some(
    (r) => r.type === "DELETE" && (r.status === "PENDING" || r.status === "PROCESSING")
  );

  const handleRequestExport = async () => {
    setExportLoading(true);
    try {
      const res = await fetch("/api/user/data-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "EXPORT" }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success("Data export requested. You'll receive an email when it's ready.");
        fetchRequests();
      } else {
        toast.error(json.error || "Request failed");
      }
    } finally {
      setExportLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/user/data-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "DELETE" }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success("Account deletion requested. You will be signed out shortly.");
        setDeleteModalOpen(false);
        setDeleteConfirm("");
        fetchRequests();
      } else {
        toast.error(json.error || "Request failed");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <div className="skeleton h-48 rounded-xl mt-6" />;

  return (
    <>
      <div className="ascend-card p-6 mt-8 border-t border-border pt-8">
        <h2 className="section-title">Your Data</h2>
        <p className="section-subtitle">
          Export or permanently delete your account and personal data.
        </p>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="font-medium text-text-primary">Export your data</h3>
            <p className="text-sm text-text-secondary mt-1">
              Download a copy of everything Ascend holds about you. Processing takes up to 24
              hours. You&apos;ll receive an email with a download link.
            </p>
            <Button
              className="mt-3"
              variant="outline"
              onClick={handleRequestExport}
              disabled={exportLoading || hasPendingExport}
            >
              {hasPendingExport ? "Export in progress…" : exportLoading ? "Requesting…" : "Request Data Export"}
            </Button>
          </div>

          <div>
            <h3 className="font-medium text-text-primary">Delete your account</h3>
            <p className="text-sm text-text-secondary mt-1">
              Permanently delete your account and personal data. Legal records (contracts,
              payments) are retained as required by law.
            </p>
            <Button
              className="mt-3"
              variant="destructive"
              onClick={() => setDeleteModalOpen(true)}
              disabled={deleteLoading || hasPendingDelete}
            >
              {hasPendingDelete ? "Deletion in progress…" : "Delete My Account"}
            </Button>
          </div>

          {requests.length > 0 && (
            <div>
              <h3 className="font-medium text-text-primary">Past requests</h3>
              <ul className="mt-2 space-y-2">
                {requests.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-2 py-2 border-b border-border last:border-0 text-sm"
                  >
                    <span className="font-medium capitalize">{r.type.toLowerCase()}</span>
                    <span className="text-text-secondary">—</span>
                    <span className="capitalize">{r.status.toLowerCase().replace(/_/g, " ")}</span>
                    <span className="text-text-secondary">
                      {new Date(r.requestedAt).toLocaleDateString()}
                    </span>
                    {r.exportUrl && (
                      <a
                        href={r.exportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Download
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account</DialogTitle>
            <DialogDescription>
              This cannot be undone. Your profile, resumes, and activity will be deleted. Reviews
              and salary data will be anonymised. Legal records are retained as required by law.
              Type <strong>DELETE</strong> below to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
            <Input
              id="delete-confirm"
              className="mt-2"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteConfirm !== "DELETE" || deleteLoading}
            >
              {deleteLoading ? "Submitting…" : "Delete my account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
