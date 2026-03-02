import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { BadgesClient } from "./BadgesClient";

export default async function SettingsBadgesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/settings/badges");

  return (
    <div className="page-container page-section">
      <h1 className="text-2xl font-bold mb-2">Certification badges</h1>
      <p className="text-muted-foreground mb-6">Add and manage your verified skill badges (HackerRank, Coursera, etc.).</p>
      <BadgesClient />
    </div>
  );
}
