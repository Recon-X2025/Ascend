import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { InterviewSubmitForm } from "@/components/company/InterviewSubmitForm";

export default async function InterviewSubmitPage(props: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  const { slug } = await props.params;
  const company = await prisma.company.findUnique({ where: { slug }, select: { name: true, slug: true } });
  if (!company) notFound();
  return (
    <div className="page-container py-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold">Share interview experience</h1>
      <p className="text-muted-foreground mt-1">{company.name}</p>
      <InterviewSubmitForm slug={company.slug} />
    </div>
  );
}
