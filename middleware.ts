import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MAIN_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "ascend.app",
  "www.ascend.app",
]);

/** Skip domain-slug lookup for standard Vercel URLs (avoids middleware timeout) */
function isMainOrVercelHost(hostname: string): boolean {
  return MAIN_HOSTS.has(hostname) || hostname.endsWith(".vercel.app");
}

export async function middleware(req: NextRequest) {
  // Phase 18: Custom careers domain → rewrite to /careers/[slug]
  const host = req.headers.get("host") ?? "";
  const hostname = host.split(":")[0];
  if (!isMainOrVercelHost(hostname)) {
    try {
      const base = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : req.nextUrl.origin;
      const res = await fetch(`${base}/api/internal/domain-slug?host=${encodeURIComponent(hostname)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const { slug } = (await res.json()) as { slug: string | null };
        if (slug) {
          const url = req.nextUrl.clone();
          url.pathname = `/careers/${slug}`;
          return NextResponse.rewrite(url);
        }
      }
    } catch {
      // ignore
    }
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const path = req.nextUrl.pathname;

  // Auth routes: if signed in and onboarding complete, redirect to dashboard
  if (path.startsWith("/auth/")) {
    if (token) {
      const complete = (token as { onboardingComplete?: boolean }).onboardingComplete;
      if (complete) {
        const role = (token as { role?: string }).role ?? "JOB_SEEKER";
        const dashboard = getDashboardForRole(role);
        return NextResponse.redirect(new URL(dashboard, req.url));
      }
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    return NextResponse.next();
  }

  // Onboarding: require auth; if already complete, redirect to dashboard
  if (path === "/onboarding") {
    if (!token) {
      const login = new URL("/auth/login", req.url);
      login.searchParams.set("callbackUrl", "/onboarding");
      return NextResponse.redirect(login);
    }
    const complete = (token as { onboardingComplete?: boolean }).onboardingComplete;
    if (complete) {
      const role = (token as { role?: string }).role ?? "JOB_SEEKER";
      return NextResponse.redirect(new URL(getDashboardForRole(role), req.url));
    }
    return NextResponse.next();
  }

  // Dashboard: require auth + onboarding complete
  if (path.startsWith("/dashboard/")) {
    if (!token) {
      const login = new URL("/auth/login", req.url);
      login.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(login);
    }
    const complete = (token as { onboardingComplete?: boolean }).onboardingComplete;
    if (!complete) return NextResponse.redirect(new URL("/onboarding", req.url));

    const role = (token as { role?: string }).role ?? "JOB_SEEKER";

    // Role-based access
    if (path.startsWith("/dashboard/seeker") && role !== "JOB_SEEKER") {
      return NextResponse.redirect(new URL(getDashboardForRole(role), req.url));
    }
    if (path.startsWith("/dashboard/recruiter") && role !== "RECRUITER" && role !== "COMPANY_ADMIN") {
      return NextResponse.redirect(new URL(getDashboardForRole(role), req.url));
    }
    if (path.startsWith("/dashboard/company") && role !== "COMPANY_ADMIN") {
      return NextResponse.redirect(new URL(getDashboardForRole(role), req.url));
    }
    if (path.startsWith("/dashboard/admin") && role !== "PLATFORM_ADMIN") {
      return NextResponse.redirect(new URL(getDashboardForRole(role), req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

function getDashboardForRole(role: string): string {
  switch (role) {
    case "PLATFORM_ADMIN":
      return "/dashboard/admin";
    case "COMPANY_ADMIN":
      return "/dashboard/company";
    case "RECRUITER":
      return "/dashboard/recruiter";
    default:
      return "/dashboard/seeker";
  }
}

export const config = {
  matcher: [
    "/",
    "/((?!api|_next|_static|favicon.ico).*)",
    "/auth/:path*",
    "/onboarding",
    "/dashboard/:path*",
  ],
};
