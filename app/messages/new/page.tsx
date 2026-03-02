import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { NewMessageClient } from "@/components/messages/NewMessageClient";

export default async function NewMessagePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  return (
    <div className="page-container py-6">
      <h1 className="text-2xl font-semibold text-foreground mb-6">New message</h1>
      <NewMessageClient />
    </div>
  );
}
