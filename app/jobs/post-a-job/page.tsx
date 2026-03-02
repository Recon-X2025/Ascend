import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { JobPostForm } from "@/components/jobs/JobPostForm";

export default async function PostAJobPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?callbackUrl=/jobs/post-a-job");
  const role = session.user.role as string;
  if (role !== "RECRUITER" && role !== "COMPANY_ADMIN") redirect("/dashboard");
  return (
    <div className="page-container py-8">
      <h1 className="text-2xl font-semibold text-text-primary">Post a job</h1>
      <p className="mt-1 text-muted-foreground">Create a new job posting.</p>
      <JobPostForm className="mt-6" />
    </div>
  );
}
