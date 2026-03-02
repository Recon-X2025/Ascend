import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { PrivacySettingsForm } from "@/components/settings/PrivacySettingsForm";

export default async function PrivacySettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?callbackUrl=/settings/privacy");
  return (
    <div className="page-container page-section max-w-2xl">
      <h1 className="text-2xl font-semibold text-text-primary">Privacy</h1>
      <p className="section-subtitle">Control who can see your profile and open-to-work status.</p>
      <PrivacySettingsForm />
    </div>
  );
}
