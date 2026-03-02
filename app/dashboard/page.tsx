import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (session.user.persona == null) redirect("/onboarding/persona");

  const role = session.user.role ?? "JOB_SEEKER";
  if (role === "PLATFORM_ADMIN") redirect("/dashboard/admin");
  if (role === "COMPANY_ADMIN") redirect("/dashboard/company");
  if (role === "RECRUITER") redirect("/dashboard/recruiter");
  redirect("/dashboard/seeker");
}
