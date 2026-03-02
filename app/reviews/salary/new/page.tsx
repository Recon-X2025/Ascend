import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { SalarySubmissionForm } from "@/components/reviews/SalarySubmissionForm";

export default async function NewSalarySubmissionPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");

  const { companyId } = await searchParams;
  if (!companyId) notFound();

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, slug: true },
  });
  if (!company) notFound();

  return (
    <div className="page-container py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold">Add your salary</h1>
      <p className="text-muted-foreground mt-1">{company.name}</p>
      <SalarySubmissionForm companyId={company.id} companyName={company.name} />
    </div>
  );
}
