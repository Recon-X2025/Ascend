"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ContractOTPModal } from "@/components/mentorship/ContractOTPModal";

const fetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))));

const SCROLL_THRESHOLD = 50;

export default function LegalSignPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const type = params.type as string;
  const next = searchParams.get("next") ?? "/mentorship";

  const [scrollReachedBottom, setScrollReachedBottom] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const validTypes = ["MENTORSHIP_MARKETPLACE_ADDENDUM", "MENTOR_CONDUCT_AGREEMENT"];
  const isValidType = validTypes.includes(type);

  const { data, error, mutate } = useSWR(
    isValidType && type ? `/api/mentorship/legal/${type}` : null,
    fetcher
  );

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setScrollReachedBottom(distanceFromBottom <= SCROLL_THRESHOLD);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    handleScroll();
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [data?.content, handleScroll]);

  if (!isValidType) {
    return (
      <div className="min-h-screen bg-[#F7F6F1] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-destructive">Invalid document type.</p>
          <Link href="/mentorship" className="text-[#16A34A] underline mt-2 inline-block">Back to Mentorship</Link>
        </div>
      </div>
    );
  }

  const canSign = scrollReachedBottom && checkboxChecked;
  const signed = data?.signed === true;

  const handleRequestOTP = async () => {
    await fetch(`/api/mentorship/legal/${type}/request-otp`, { method: "POST" });
  };

  const handleSubmitOTP = async (otp: string): Promise<{ success: boolean; error?: string }> => {
    const res = await fetch(`/api/mentorship/legal/${type}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: json.error ?? "Failed to sign" };
    return { success: true };
  };

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F7F6F1] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">{error?.message ?? "Loading…"}</p>
          <Link href="/mentorship" className="text-[#16A34A] underline mt-2 inline-block">Back to Mentorship</Link>
        </div>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-[#F7F6F1] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-lg font-medium text-[#0F1A0F]">You have already signed this document.</p>
          <Link href={next}>
            <Button className="mt-4">Continue</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F1] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <Link href="/" className="text-xl font-bold text-[#0F1A0F]">Ascend</Link>
          <h1 className="text-lg font-semibold text-[#0F1A0F] mt-2">Legal Agreement</h1>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#0F1A0F]">{data.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Version {data.version} | Effective: {data.effectiveAt?.slice(0, 10)}
          </p>

          <div
            ref={containerRef}
            className="mt-4 max-h-[50vh] overflow-y-auto rounded border border-[var(--border)] p-4 text-sm whitespace-pre-wrap"
          >
            {data.content}
          </div>

          <div className="mt-4 space-y-4">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={checkboxChecked}
                onChange={(e) => setCheckboxChecked(e.target.checked)}
                disabled={!scrollReachedBottom}
                className="mt-1"
              />
              <span className="text-sm">
                I have read and understood this agreement.
                {!scrollReachedBottom && (
                  <span className="block text-muted-foreground text-xs mt-1">
                    Scroll to the bottom of the document to enable.
                  </span>
                )}
              </span>
            </label>

            <Button
              className="w-full"
              disabled={!canSign}
              onClick={() => setOtpOpen(true)}
            >
              Sign with OTP
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link href="/mentorship" className="text-[#16A34A] hover:underline">Cancel and return to Mentorship</Link>
        </p>
      </div>

      <ContractOTPModal
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        maskedEmail={data.maskedEmail ?? "your email"}
        onRequestOTP={handleRequestOTP}
        onSubmitOTP={handleSubmitOTP}
        onSuccess={() => {
          mutate();
          window.location.href = next;
        }}
      />
    </div>
  );
}
