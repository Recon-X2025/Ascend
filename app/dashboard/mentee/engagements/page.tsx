import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { MenteeEngagementsClient } from "@/components/mentorship/MenteeEngagementsClient";

export default async function MenteeEngagementsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/dashboard/mentee/engagements");
  }
  return <MenteeEngagementsClient />;
}
