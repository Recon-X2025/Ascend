import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { ProfileEditPage } from "@/components/profile/ProfileEditPage";

export default async function ProfileEditRoute() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?callbackUrl=/profile/edit");
  return (
    <div className="min-h-screen bg-surface">
      <ProfileEditPage />
    </div>
  );
}
