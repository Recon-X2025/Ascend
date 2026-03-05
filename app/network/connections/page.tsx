import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { NetworkPageClient } from "@/components/network/NetworkPageClient";
import { Container } from "@/components/layout/Container";

export default async function NetworkConnectionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/network/connections");
  }
  return (
    <Container className="py-8">
      <h1 className="text-2xl font-semibold text-foreground mb-6">Connections</h1>
      <NetworkPageClient />
    </Container>
  );
}
