import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { MentorDashboardNav } from "@/components/mentorship/mentor-dashboard/MentorDashboardNav";

export default async function MentorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/dashboard/mentor");
  }

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) {
    redirect("/mentorship/become-a-mentor");
  }

  return (
    <div className="min-h-screen bg-[#F7F6F1] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <MentorDashboardNav />
        {children}
      </div>
    </div>
  );
}
