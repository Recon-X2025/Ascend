import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { Container } from "@/components/layout/Container";
import { InternalPortalClient } from "./InternalPortalClient";

type Props = { params: Promise<{ companySlug: string }> };

export default async function InternalPortalPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=" + encodeURIComponent(`/internal/${(await params).companySlug}`));
  }
  const { companySlug } = await params;
  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    select: { id: true, name: true, slug: true },
  });
  if (!company) {
    return (
      <Container className="py-8">
        <p className="text-muted-foreground">Company not found.</p>
      </Container>
    );
  }
  const employee = await prisma.companyEmployee.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId: company.id } },
  });
  return (
    <Container className="py-8">
      <InternalPortalClient
        companySlug={company.slug}
        companyName={company.name}
        isEmployee={!!employee}
      />
    </Container>
  );
}
