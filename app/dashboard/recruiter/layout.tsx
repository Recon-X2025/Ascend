import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { RecruiterNav } from "@/components/dashboard/recruiter/RecruiterNav";

export default async function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?callbackUrl=/dashboard/recruiter");
  const role = (session.user as { role?: string }).role;
  if (role !== "RECRUITER" && role !== "COMPANY_ADMIN") redirect("/dashboard");

  return (
    <div className="page-container page-section">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-56 shrink-0">
          <RecruiterNav />
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
