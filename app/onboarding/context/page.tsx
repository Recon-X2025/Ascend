import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import type { UserPersona } from "@prisma/client";
import { ContextFlowClient } from "@/components/onboarding/ContextFlowClient";

export default async function OnboardingContextPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?callbackUrl=/onboarding/context");
  const persona = session.user.persona;
  if (persona == null) redirect("/onboarding/persona");

  return (
    <ContextFlowClient
      initialPersona={persona as UserPersona}
    />
  );
}
