import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { SeekerApplicationsClient } from "@/components/applications/SeekerApplicationsClient";

export default async function SeekerApplicationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/dashboard/seeker/applications");
  const role = (session.user as { role?: string }).role;
  if (role !== "JOB_SEEKER") redirect("/dashboard");

  return (
    <div className="page-container py-6">
      <h1 className="text-2xl font-semibold">My Applications</h1>
      <SeekerApplicationsClient />
    </div>
  );
}
