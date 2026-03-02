import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";

export default async function MenteeDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/dashboard/mentee/engagements");
  }
  return (
    <div className="min-h-screen bg-[#F7F6F1] px-4 py-8">
      <div className="max-w-3xl mx-auto">{children}</div>
    </div>
  );
}
