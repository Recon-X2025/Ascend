import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { FeedPageClient } from "@/components/feed/FeedPageClient";

export default async function FeedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");
  return (
    <div className="page-container py-8">
      <h1 className="text-2xl font-semibold text-foreground mb-6">Career updates</h1>
      <FeedPageClient />
    </div>
  );
}
