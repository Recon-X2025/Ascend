import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { MessagesPageClient } from "@/components/messages/MessagesPageClient";
import { Container } from "@/components/layout/Container";

export default async function NetworkMessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/network/messages");
  }
  return (
    <Container className="py-6">
      <h1 className="text-2xl font-semibold text-foreground mb-6">Messages</h1>
      <MessagesPageClient />
    </Container>
  );
}
