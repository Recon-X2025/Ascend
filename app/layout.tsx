import "./globals.css";
import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildWebSiteSchema } from "@/lib/seo/schemas";
import { JsonLd } from "@/components/seo/JsonLd";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { LayoutChrome } from "@/components/layout/LayoutChrome";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";

/** Critical CSS inlined so the page is never unstyled if the bundle fails to load (dev glitches, cache, streaming). */
const CRITICAL_CSS = `
  :root {
    --bg:#f7f6f1;--surface:#fff;--surface-2:#f0efe9;--border:#e8e6df;--border-mid:#d4d1c8;
    --green:#16a34a;--green-dark:#0f6930;--green-light:#dcfce7;--green-mid:#bbf7d0;--green-tint:rgba(22,163,74,.06);
    --ink:#0f1a0f;--ink-2:#374151;--ink-3:#6b7280;--ink-4:#9ca3af;--ink-5:#d1d5db;
    --background:247 246 241;--foreground:15 26 15;--card:255 255 255;--primary:15 105 48;--accent:22 163 74;
    --muted:240 239 233;--muted-foreground:107 114 128;--radius:.5rem;--ring:22 163 74;
  }
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{background-color:var(--bg);color:var(--ink);font-family:var(--font-dm-sans),system-ui,sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased;margin:0}
  a{color:var(--green)}
  a:hover{text-decoration:underline}
`;

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

/** Force dynamic render to avoid React 419 (Suspense boundary) in production */
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Ascend — Find Jobs, Reviews & Salary Insights in India",
  description:
    "Ascend is India's career platform. Search jobs with fit scores, compare salaries, read company reviews, and get mentored across borders.",
  path: "/",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning style={{ colorScheme: "light" }}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#16A34A" />
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
      </head>
      <body
        className={`${syne.variable} ${dmSans.variable} font-sans antialiased min-h-screen`}
        suppressHydrationWarning
        style={{ backgroundColor: "#f7f6f1", color: "#0f1a0f" }}
      >
        <JsonLd schema={buildWebSiteSchema()} />
        <AppErrorBoundary>
          <SessionProvider>
            <LayoutChrome>{children}</LayoutChrome>
          </SessionProvider>
        </AppErrorBoundary>
      </body>
    </html>
  );
}
