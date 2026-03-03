import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import {
  clearUserDenyAll,
  isTokenDenied,
  isTokenIssuedBeforeDenyAll,
} from "@/lib/auth/denylist";
import { grantCompanyEmployeeByEmail } from "@/lib/auth/employee-verification";
import { logAudit } from "@/lib/audit/log";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";

export const authOptions = {
  trustHost: true, // Vercel: use request host for redirects
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          role: user.role,
          onboardingComplete: user.onboardingComplete,
          persona: user.persona ?? undefined,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET
      ? [
          LinkedInProvider({
            clientId: process.env.LINKEDIN_CLIENT_ID,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
            authorization: {
              params: {
                scope: "openid profile email",
              },
            },
            issuer: "https://www.linkedin.com",
            jwks_endpoint: "https://www.linkedin.com/oauth/openid/jwks",
            async profile(profile: Record<string, unknown>) {
              return {
                id: (profile.sub as string) ?? "",
                name: (profile.name as string) ?? null,
                email: (profile.email as string) ?? null,
                image: (profile.picture as string) ?? null,
                role: "JOB_SEEKER" as const,
                onboardingComplete: false,
              };
            },
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  logger: {
    error: (code, metadata) => console.error("[NextAuth]", code, metadata),
    warn: (code) => console.warn("[NextAuth]", code),
    debug: () => {},
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (!token.jti) {
        token.jti = randomUUID();
      }
      if (token.iat === undefined) {
        token.iat = Math.floor(Date.now() / 1000);
      }

      if (user) {
        const email = user.email;
        if (email && (account?.provider === "google" || account?.provider === "linkedin")) {
          const dbUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true, role: true, onboardingComplete: true, persona: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.onboardingComplete = dbUser.onboardingComplete;
            token.persona = dbUser.persona ?? null;
            await clearUserDenyAll(dbUser.id);
          } else {
            token.id = token.sub ?? "";
            token.role = "JOB_SEEKER";
            token.onboardingComplete = false;
            token.persona = null;
          }
        } else {
          token.id = (user as { id?: string }).id ?? token.sub ?? "";
          token.role = ((user as { role?: string }).role ?? "JOB_SEEKER") as Role;
          token.onboardingComplete = (user as { onboardingComplete?: boolean }).onboardingComplete ?? false;
          token.persona = (user as { persona?: string | null }).persona ?? token.persona ?? null;
        }
      }
      if (trigger === "update" && session) {
        token.onboardingComplete = session.onboardingComplete ?? token.onboardingComplete;
        token.role = session.role ?? token.role;
        if (session.persona !== undefined) token.persona = session.persona;
      }
      return token;
    },
    async session({ session, token }) {
      try {
        if (token.jti && (await isTokenDenied(token.jti as string))) {
          return { ...session, user: undefined } as typeof session & { user: undefined };
        }
        if (token.id && typeof token.iat === "number") {
          const denied = await isTokenIssuedBeforeDenyAll(token.id as string, token.iat);
          if (denied) {
            return { ...session, user: undefined } as typeof session & { user: undefined };
          }
        }
      } catch {
        // Redis down — treat as not denied so auth still works
      }
      if (token.id) {
        let user;
        try {
          user = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { bannedAt: true, preferredCurrency: true },
          });
        } catch {
          user = null; // DB down — continue with token data only
        }
        if (user?.bannedAt) {
          return { ...session, user: undefined } as typeof session & { user: undefined };
        }
        if (session.user && user) {
          (session.user as { preferredCurrency?: string }).preferredCurrency = user.preferredCurrency;
        }
      }
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.onboardingComplete = token.onboardingComplete as boolean;
        session.user.persona = (token.persona as import("@prisma/client").UserPersona) ?? null;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (!user.email) return false;
      if (account?.provider === "google" || account?.provider === "linkedin") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (!existingUser) {
          const created = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name ?? null,
              image: user.image ?? null,
              emailVerified: new Date(),
              role: "JOB_SEEKER",
              onboardingComplete: false,
              accounts: {
                create: {
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token ?? null,
                  refresh_token: account.refresh_token ?? null,
                  expires_at: account.expires_at ?? null,
                },
              },
            },
          });
          logAudit({
            actorId: created.id,
            actorRole: "JOB_SEEKER",
            category: "AUTH",
            action: AUDIT_ACTIONS.AUTH_OAUTH_SUCCESS,
            severity: "INFO",
            targetType: "User",
            targetId: created.id,
            metadata: { provider: account.provider },
          }).catch(() => {});
        } else {
          logAudit({
            actorId: existingUser.id,
            actorRole: existingUser.role,
            category: "AUTH",
            action: AUDIT_ACTIONS.AUTH_OAUTH_SUCCESS,
            severity: "INFO",
            targetType: "User",
            targetId: existingUser.id,
            metadata: { provider: account.provider },
          }).catch(() => {});
          const linkedAccount = await prisma.account.findFirst({
            where: {
              userId: existingUser.id,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          });
          if (!linkedAccount) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token ?? null,
                refresh_token: account.refresh_token ?? null,
                expires_at: account.expires_at ?? null,
              },
            });
          }
        }
      } else if (account?.provider === "credentials" && (user as { id?: string }).id) {
        const uid = (user as { id: string }).id;
        logAudit({
          actorId: uid,
          actorRole: (user as { role?: string }).role ?? "JOB_SEEKER",
          category: "AUTH",
          action: AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS,
          severity: "INFO",
          targetType: "User",
          targetId: uid,
        }).catch(() => {});
      }
      if (user.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } });
        if (dbUser) grantCompanyEmployeeByEmail(dbUser.id, user.email).catch(() => {});
      }
      return true;
    },
  },
} as NextAuthOptions;
