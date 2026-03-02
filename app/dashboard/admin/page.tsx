import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { AdminDashboardClient } from "@/components/dashboard/admin/AdminDashboardClient";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if ((session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    redirect("/dashboard");
  }
  return <AdminDashboardClient />;
}
