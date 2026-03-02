import "next-auth";
import { DefaultSession } from "next-auth";
import type { Role, UserPersona } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: Role;
      onboardingComplete: boolean;
      persona?: UserPersona | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role;
    onboardingComplete: boolean;
    persona?: UserPersona | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    onboardingComplete: boolean;
    persona?: string | null;
    jti: string;
    iat: number;
  }
}
