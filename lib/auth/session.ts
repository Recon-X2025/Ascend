import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";

export function getSession() {
  return getServerSession(authOptions);
}
