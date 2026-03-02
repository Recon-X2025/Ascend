"use client";

import { useState, useRef, useEffect } from "react";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 3;

interface ContractOTPModalProps {
  open: boolean;
  onClose: () => void;
  maskedEmail: string;
  onRequestOTP: () => Promise<void>;
  onSubmitOTP: (otp: string) => Promise<{ success: boolean; error?: string }>;
  /** If provided, called instead of window.location.reload() on success (e.g. redirect to ?next=) */
  onSuccess?: () => void;
}

export function ContractOTPModal({
  open,
  onClose,
  maskedEmail,
  onRequestOTP,
  onSubmitOTP,
  onSuccess,
}: ContractOTPModalProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!open) {
      setDigits(Array(OTP_LENGTH).fill(""));
      setAttempts(0);
      setSuccess(false);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      const chars = value.slice(0, OTP_LENGTH).split("");
      const next = [...digits];
      chars.forEach((c, i) => {
        if (index + i < OTP_LENGTH) next[index + i] = c.replace(/\D/g, "");
      });
      setDigits(next);
      const nextFocus = Math.min(index + chars.length, OTP_LENGTH - 1);
      inputRefs.current[nextFocus]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, "");
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError(null);
    try {
      await onRequestOTP();
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to resend");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const otp = digits.join("");
    if (otp.length !== OTP_LENGTH) return;
    if (attempts >= MAX_ATTEMPTS) {
      setError("Too many attempts. Request a new code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await onSubmitOTP(otp);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
          else window.location.reload();
        }, 1500);
      } else {
        setAttempts((a) => a + 1);
        setError(result.error ?? "Invalid code");
      }
    } catch (e) {
      setAttempts((a) => a + 1);
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6">
        {success ? (
          <p className="text-center text-green-600 font-medium">Signed successfully.</p>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-[#0F1A0F] mb-2">
              Enter verification code
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              We&apos;ve sent a 6-digit code to {maskedEmail}. Enter it below to sign.
            </p>
            <div className="flex gap-2 justify-center mb-4">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-10 h-12 text-center text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16A34A] focus:border-[#16A34A]"
                />
              ))}
            </div>
            {error && (
              <p className="text-sm text-red-600 mb-2">{error}</p>
            )}
            {attempts >= MAX_ATTEMPTS && (
              <p className="text-sm text-amber-600 mb-2">
                Too many attempts. Request a new code.
              </p>
            )}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={loading || digits.join("").length !== OTP_LENGTH || attempts >= MAX_ATTEMPTS}
                className="w-full py-2 rounded-lg bg-[#16A34A] text-white font-medium disabled:opacity-50"
              >
                {loading ? "Signing…" : "Sign contract"}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                className="text-sm text-[#16A34A] disabled:opacity-50"
              >
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : "Resend code"}
              </button>
            </div>
          </>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full text-sm text-muted-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
