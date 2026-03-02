import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { CareersConfigClient } from "@/components/dashboard/company/CareersConfigClient";

export default async function CompanyCareersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?callbackUrl=/dashboard/company/careers");
  const role = (session.user as { role?: string }).role;
  if (role !== "COMPANY_ADMIN" && role !== "RECRUITER") redirect("/dashboard");
  return <CareersConfigClient />;
}
