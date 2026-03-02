import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { AdminGrowthClient } from "@/components/dashboard/admin/AdminGrowthClient";

export default async function AdminGrowthPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");
  if ((session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    redirect("/dashboard");
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Growth & Virality</h1>
      <AdminGrowthClient />
    </div>
  );
}
