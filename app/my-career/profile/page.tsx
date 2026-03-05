import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";

export default async function MyCareerProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/my-career/profile");
  }
  redirect("/profile/edit");
}
