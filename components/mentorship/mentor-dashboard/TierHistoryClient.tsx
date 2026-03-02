"use client";

import Link from "next/link";

type Row = {
  previousTier: string;
  newTier: string;
  reason: string;
  createdAt: string;
};

export function TierHistoryClient({ rows }: { rows: Row[] }) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/mentor" className="text-green font-body text-sm hover:underline">
          ← Mentor dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[#0F1A0F] mb-4">Tier history</h1>
      {rows.length === 0 ? (
        <p className="text-ink-3">No tier changes yet.</p>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Previous</th>
                <th className="text-left p-3 font-medium">New</th>
                <th className="text-left p-3 font-medium">Reason</th>
                <th className="text-left p-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-[var(--border)]">
                  <td className="p-3">{row.previousTier}</td>
                  <td className="p-3">{row.newTier}</td>
                  <td className="p-3">{row.reason}</td>
                  <td className="p-3">{new Date(row.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
