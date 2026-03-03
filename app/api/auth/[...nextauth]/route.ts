import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";

export const maxDuration = 30;

const DEFAULT_MAX_AGE = 24 * 60 * 60; // 24 hours

/** Fail fast with clear JSON (not HTML) if NEXTAUTH_SECRET missing in production */
function ensureAuthSecret(): void {
  if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not set. Set it in Vercel env vars (generate with: openssl rand -base64 32)");
  }
}
const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

async function getOptions(req: Request) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const remember = cookieHeader.includes("ascend_remember=1");
  return {
    ...authOptions,
    session: {
      ...authOptions.session,
      maxAge: remember ? REMEMBER_ME_MAX_AGE : DEFAULT_MAX_AGE,
    },
  };
}

export async function GET(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    ensureAuthSecret();
    const options = await getOptions(req);
    return await NextAuth(options)(req, context as { params: Promise<{ nextauth: string[] }> });
  } catch (err) {
    console.error("NextAuth GET error:", err);
    return Response.json({ error: "Authentication error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    ensureAuthSecret();
    const options = await getOptions(req);
    return await NextAuth(options)(req, context as { params: Promise<{ nextauth: string[] }> });
  } catch (err) {
    console.error("NextAuth POST error:", err);
    return Response.json({ error: "Authentication error" }, { status: 500 });
  }
}
