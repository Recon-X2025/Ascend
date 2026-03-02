import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { CompanyApiClient } from "@/components/dashboard/company/CompanyApiClient";

export default async function CompanyApiPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?callbackUrl=/dashboard/company/api");
  const role = (session.user as { role?: string }).role;
  if (role !== "COMPANY_ADMIN") redirect("/dashboard");
  return <CompanyApiClient />;
}
