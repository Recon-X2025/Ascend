"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CompanyDashboardReviews({ slug }: { slug: string }) {
  const [reviews, setReviews] = useState<{ id: string; jobTitle: string; overallRating: number; status: string; reviewer: string; createdAt: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (statusFilter !== "all") params.set("status", statusFilter);
    fetch(`/api/companies/${slug}/admin/reviews?${params}`).then((r) => r.json()).then((d) => {
      setReviews(d.reviews ?? []);
      setTotal(d.totalCount ?? 0);
      setLoading(false);
    });
  }, [slug, page, statusFilter]);

  const updateStatus = (reviewId: string, status: string) => {
    fetch(`/api/companies/${slug}/reviews/${reviewId}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).then((r) => r.ok && setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, status } : r))));
  };

  const totalPages = Math.ceil(total / 10) || 1;
  return (
    <Card>
      <CardHeader><CardTitle>Reviews</CardTitle><p className="text-sm text-muted-foreground">Approve, reject, or flag. Cannot delete.</p></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {["all", "PENDING", "APPROVED", "FLAGGED"].map((s) => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => { setStatusFilter(s); setPage(1); }}>{s === "all" ? "All" : s}</Button>
          ))}
        </div>
        {loading ? <p>Loading...</p> : (
          <>
            <table className="w-full text-sm"><thead><tr className="border-b"><th className="text-left py-2">Reviewer</th><th className="text-left py-2">Job</th><th className="text-left py-2">Rating</th><th className="text-left py-2">Status</th><th className="text-left py-2">Actions</th></tr></thead><tbody>
              {reviews.map((r) => (
                <tr key={r.id} className="border-b"><td className="py-2">{r.reviewer}</td><td className="py-2">{r.jobTitle}</td><td className="py-2">⭐ {r.overallRating}</td><td className="py-2">{r.status}</td><td className="py-2">
                {r.status === "PENDING" && <><Button size="sm" variant="outline" className="mr-1" onClick={() => updateStatus(r.id, "APPROVED")}>Approve</Button><Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "REJECTED")}>Reject</Button></>}
                {r.status === "APPROVED" && <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "FLAGGED")}>Flag</Button>}
                {r.status === "FLAGGED" && <><Button size="sm" variant="outline" className="mr-1" onClick={() => updateStatus(r.id, "APPROVED")}>Approve</Button><Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "REJECTED")}>Reject</Button></>}
              </td></tr>
              ))}
            </tbody></table>
            <div className="flex justify-between"><p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button><Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button></div></div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
