import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { BecomeAMentorFlowClient } from "@/components/mentorship/become-a-mentor/BecomeAMentorFlowClient";

export default async function BecomeAMentorPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/mentorship/become-a-mentor");
  }

  return (
    <div className="min-h-screen bg-[#F7F6F1] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <BecomeAMentorFlowClient />
      </div>
    </div>
  );
}
