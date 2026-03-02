import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { TrustSafetyClient } from "@/components/dashboard/admin/TrustSafetyClient";

export default async function AdminTrustSafetyPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if ((session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    redirect("/dashboard");
  }
  return <TrustSafetyClient />;
}
