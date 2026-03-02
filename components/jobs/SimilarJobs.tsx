import Link from "next/link";

interface SimilarJob {
  id: number;
  slug: string;
  title: string;
  type: string;
  workMode: string;
  locations: string[];
  salaryVisible: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  companyName: string | null;
  company: { slug: string; name: string } | null;
  publishedAt: string | null;
}

export function SimilarJobs({ jobs }: { jobs: SimilarJob[] }) {
  if (jobs.length === 0) return null;
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Similar jobs</h2>
      <ul className="space-y-2">
        {jobs.map((j) => (
          <li key={j.id}>
            <Link href={`/jobs/${j.slug}`} className="block ascend-card p-3 hover:bg-muted/30 transition-colors">
              <span className="font-medium text-foreground">{j.title}</span>
              <p className="text-sm text-muted-foreground mt-0.5">
                {j.company?.name ?? j.companyName ?? "Company"} · {j.workMode.replace(/_/g, " ")}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
