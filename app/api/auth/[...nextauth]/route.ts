import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";

const DEFAULT_MAX_AGE = 24 * 60 * 60; // 24 hours
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
  const options = await getOptions(req);
  return NextAuth(options)(req, context as { params: Promise<{ nextauth: string[] }> });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const options = await getOptions(req);
  return NextAuth(options)(req, context as { params: Promise<{ nextauth: string[] }> });
}
