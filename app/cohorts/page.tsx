import { listCohorts } from "@/lib/cohorts";
import Link from "next/link";

export default async function CohortsPage() {
  const cohorts = await listCohorts();
  return (
    <div className="min-h-screen bg-[#F7F6F1] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-[#0F1A0F] mb-2">Cohort communities</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Open groups by transition path. Join to connect and share.
        </p>
        {cohorts.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-white p-8 text-center">
            <p className="text-muted-foreground">No cohorts yet. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cohorts.map((c) => (
              <Link
                key={c.id}
                href={`/cohorts/${c.slug}`}
                className="block rounded-xl border border-[var(--border)] bg-white p-4 hover:bg-[#FAFAF7]"
              >
                <h2 className="font-semibold text-ink">{c.name}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {c.transitionPath} · {c._count.members} members · {c._count.threads} threads
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
