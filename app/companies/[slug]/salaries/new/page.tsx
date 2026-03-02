import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { SalarySubmitForm } from "@/components/company/SalarySubmitForm";

export default async function SalarySubmitPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  const { slug } = await params;
  const company = await prisma.company.findUnique({ where: { slug }, select: { id: true, name: true, slug: true } });
  if (!company) notFound();
  return (
    <div className="page-container py-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold">Add your salary</h1>
      <p className="text-muted-foreground mt-1">{company.name}</p>
      <p className="text-sm text-muted-foreground mt-2">Your salary data is always anonymous. We never show individual submissions.</p>
      <SalarySubmitForm slug={company.slug} />
    </div>
  );
}
