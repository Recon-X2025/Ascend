"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { CookieBanner } from "@/components/ui/CookieBanner";
import { Toaster } from "react-hot-toast";

export function LayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboardingPage = pathname === "/onboarding/persona" || pathname === "/onboarding/context";

  if (isOnboardingPage) {
    return (
      <div
        className="min-h-screen flex flex-col bg-bg"
        style={{ backgroundColor: "var(--bg)" }}
      >
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.875rem",
              color: "var(--ink)",
            },
            success: { iconTheme: { primary: "var(--green)", secondary: "var(--surface)" }, style: { borderLeft: "3px solid var(--green)" } },
            error: { iconTheme: { primary: "#DC2626", secondary: "var(--surface)" }, style: { borderLeft: "3px solid #FF4444" } },
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-screen flex-col bg-bg"
      style={{ backgroundColor: "#f7f6f1", minHeight: "100vh" }}
    >
      <a
        href="#main-content"
        className="sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:w-auto focus:h-auto focus:px-4 focus:py-2 focus:bg-green focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-green-mid"
      >
        Skip to main content
      </a>
      <Navbar />
      <main
        id="main-content"
        className="flex-1 min-h-0 pb-16 lg:pb-0 flex flex-col bg-bg"
        style={{ backgroundColor: "#f7f6f1" }}
      >
        {children}
      </main>
      <Footer />
      <BottomNav />
      <CookieBanner />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.875rem",
            color: "var(--ink)",
          },
          success: { iconTheme: { primary: "var(--green)", secondary: "var(--surface)" }, style: { borderLeft: "3px solid var(--green)" } },
          error: { iconTheme: { primary: "#DC2626", secondary: "var(--surface)" }, style: { borderLeft: "3px solid #FF4444" } },
        }}
      />
    </div>
  );
}
