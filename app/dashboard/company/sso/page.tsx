import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { SsoConfigClient } from "@/components/dashboard/company/SsoConfigClient";

export default async function CompanySsoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?callbackUrl=/dashboard/company/sso");
  const role = (session.user as { role?: string }).role;
  if (role !== "COMPANY_ADMIN") redirect("/dashboard");
  return <SsoConfigClient />;
}
