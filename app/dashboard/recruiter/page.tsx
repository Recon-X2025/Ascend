import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { RecruiterDashboardClient } from "@/components/dashboard/recruiter/RecruiterDashboardClient";

export default async function RecruiterDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  const role = (session.user as { role?: string }).role;
  if (role !== "RECRUITER" && role !== "COMPANY_ADMIN") {
    redirect("/dashboard");
  }
  return <RecruiterDashboardClient />;
}
