"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const COOKIE_CONSENT = "cookie_consent";
const ANALYTICS_CONSENT = "analytics_consent";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

export function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const consent = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COOKIE_CONSENT}=`))
      ?.split("=")[1];
    setVisible(!consent);
    setMounted(true);
  }, []);

  const acceptAll = () => {
    setCookie(COOKIE_CONSENT, "all");
    setCookie(ANALYTICS_CONSENT, "true");
    setVisible(false);
  };

  const essentialOnly = () => {
    setCookie(COOKIE_CONSENT, "essential");
    setCookie(ANALYTICS_CONSENT, "false");
    setVisible(false);
    if (typeof window !== "undefined" && (window as unknown as { posthog?: { opt_out_capturing: () => void } }).posthog) {
      (window as unknown as { posthog: { opt_out_capturing: () => void } }).posthog.opt_out_capturing();
    }
  };

  if (!mounted || !visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[1000] flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-5 py-4 md:px-8 md:py-5"
      style={{
        background: "var(--ink)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="font-body max-w-[560px]">
        <p className="font-semibold text-[0.9rem] text-white mb-1">We use cookies</p>
        <p className="text-[0.825rem] text-white/60 leading-relaxed">
          Ascend uses essential cookies for the Platform to work, and optional analytics cookies to improve your experience. We never use advertising or tracking cookies.{" "}
          <Link href="/legal/cookies" className="text-green hover:underline">
            Cookie Policy
          </Link>
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={essentialOnly}
          className="font-body text-[0.875rem] font-medium px-4 py-2.5 rounded-lg border border-white/40 text-white hover:bg-white/10 transition-colors"
        >
          Essential only
        </button>
        <button
          type="button"
          onClick={acceptAll}
          className="font-body text-[0.875rem] font-medium px-4 py-2.5 rounded-lg text-white transition-colors"
          style={{ backgroundColor: "var(--green)" }}
        >
          Accept all
        </button>
      </div>
    </div>
  );
}
