import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";

export default async function ResumeOptimiserPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/my-career/resume-optimiser");
  }
  redirect("/resume/build");
}
