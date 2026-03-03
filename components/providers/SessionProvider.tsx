"use client";

import { Suspense } from "react";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

function SessionInner({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f7f6f1" }} />}>
      <SessionInner>{children}</SessionInner>
    </Suspense>
  );
}
