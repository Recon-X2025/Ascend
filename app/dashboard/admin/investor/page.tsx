import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { InvestorDashboardClient } from "@/components/dashboard/admin/InvestorDashboardClient";

export default async function AdminInvestorPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if ((session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    redirect("/dashboard");
  }
  return <InvestorDashboardClient />;
}
