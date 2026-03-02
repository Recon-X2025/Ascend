import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { CompanyDashboard } from "@/components/dashboard/company/CompanyDashboard";

export default async function CompanyDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");
  const role = session.user.role ?? "JOB_SEEKER";
  if (role !== "COMPANY_ADMIN") redirect("/dashboard");

  const first = await prisma.companyAdmin.findFirst({
    where: { userId: session.user.id },
    include: { company: { select: { slug: true, name: true } } },
  });
  if (!first?.company) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-semibold">Company Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">You are not an admin of any company yet. Claim a company to get started.</p>
        <a href="/companies" className="mt-4 inline-block text-primary hover:underline">Browse companies</a>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <CompanyDashboard slug={first.company.slug} companyName={first.company.name} />
    </div>
  );
}
