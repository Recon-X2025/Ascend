import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { SettingsNav } from "@/components/settings/SettingsNav";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?callbackUrl=/settings/account");

  return (
    <div className="page-container page-section">
      <div className="flex flex-col md:flex-row gap-8">
        <nav className="md:w-48 shrink-0">
          <SettingsNav />
        </nav>
        <main className="flex-1 min-w-0 ascend-card p-6">{children}</main>
      </div>
    </div>
  );
}
