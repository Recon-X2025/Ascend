import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { SeekerDashboardClient } from "@/components/dashboard/seeker/SeekerDashboardClient";

export default async function SeekerDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if ((session.user as { role?: string }).role !== "JOB_SEEKER") {
    redirect("/dashboard");
  }
  return <SeekerDashboardClient />;
}
