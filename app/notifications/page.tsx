import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { NotificationsListClient } from "@/components/notifications/NotificationsListClient";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?callbackUrl=/notifications");
  return (
    <div className="page-container py-8">
      <h1 className="text-2xl font-semibold text-foreground mb-4">
        Notifications
      </h1>
      <NotificationsListClient />
    </div>
  );
}
