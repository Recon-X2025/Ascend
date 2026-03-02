import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { AdminEnterpriseClient } from "@/components/dashboard/admin/AdminEnterpriseClient";

export default async function AdminEnterprisePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?callbackUrl=/dashboard/admin/enterprise");
  if ((session.user as { role?: string }).role !== "PLATFORM_ADMIN") redirect("/dashboard");
  return <AdminEnterpriseClient />;
}
