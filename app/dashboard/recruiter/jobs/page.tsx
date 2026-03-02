import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { Button } from "@/components/ui/button";

export default async function RecruiterJobsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?callbackUrl=/dashboard/recruiter/jobs");
  const role = session.user.role as string;
  if (role !== "RECRUITER" && role !== "COMPANY_ADMIN") redirect("/dashboard");

  const jobs = await prisma.jobPost.findMany({
    where: { recruiterId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { companyRef: { select: { name: true, slug: true } } },
  });

  const activeCount = jobs.filter((j) => j.status === "ACTIVE").length;
  const totalApplicants = jobs.reduce((a, j) => a + j.applicationCount, 0);

  return (
    <div className="page-container py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-text-primary">Your jobs</h1>
        <Button asChild>
          <Link href="/jobs/post-a-job">Post a New Job</Link>
        </Button>
      </div>
      <p className="mt-1 text-muted-foreground">
        {activeCount} Active · {totalApplicants} Total applicants
      </p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 font-medium">Title</th>
              <th className="text-left py-2 font-medium">Status</th>
              <th className="text-left py-2 font-medium">Created</th>
              <th className="text-left py-2 font-medium">Views</th>
              <th className="text-left py-2 font-medium">Applications</th>
              <th className="text-left py-2 font-medium">Deadline</th>
              <th className="text-left py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-border">
                <td className="py-3">
                  <Link href={`/jobs/${job.slug}`} className="font-medium hover:underline">
                    {job.title}
                  </Link>
                </td>
                <td className="py-3">
                  <span
                    className={
                      job.status === "ACTIVE"
                        ? "text-green-600"
                        : job.status === "DRAFT"
                          ? "text-muted-foreground"
                          : "text-amber-600"
                    }
                  >
                    {job.status}
                  </span>
                </td>
                <td className="py-3 text-muted-foreground">
                  {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : ""}
                </td>
                <td className="py-3">{job.viewCount}</td>
                <td className="py-3">{job.applicationCount}</td>
                <td className="py-3 text-muted-foreground">
                  {job.deadline ? new Date(job.deadline).toLocaleDateString() : "—"}
                </td>
                <td className="py-3">
                  <Link href={`/dashboard/recruiter/jobs/${job.id}/applications`} className="text-primary hover:underline mr-2">
                    Applications
                  </Link>
                  <Link href={`/jobs/post-a-job?edit=${job.id}`} className="text-primary hover:underline mr-2">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {jobs.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">No jobs yet. Post your first job to get started.</p>
        )}
      </div>
    </div>
  );
}
