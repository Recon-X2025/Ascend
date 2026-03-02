"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { ContractOTPModal } from "./ContractOTPModal";

type ContractStatus =
  | "PENDING_MENTOR_SIGNATURE"
  | "PENDING_MENTEE_SIGNATURE"
  | "ACTIVE"
  | "COMPLETED"
  | "VOID"
  | "DISPUTED"
  | "TERMINATED_BY_MENTOR"
  | "TERMINATED_BY_MENTEE";

type ContractContentShape = {
  mentor: { fullName: string; verifiedRole: string; email: string };
  mentee: { fullName: string; targetRole: string; currentRole: string; email: string };
  engagementScope: {
    goal: string;
    commitment: string;
    timeline: string;
    engagementType: string;
    sessionCount: number;
    sessionFrequency: string;
    sessionDurationMins: number;
  };
  clauses: Record<string, string>;
  governingLaw: { acts: string[]; jurisdiction: string };
  tcVersion: string;
  generatedAt: string;
};

export type ContractPayload = {
  id: string;
  status: ContractStatus | string;
  contractContent: ContractContentShape | null;
  tcVersion?: string;
  mentorSignDeadline: string | null;
  menteeSignDeadline: string | null;
  pdfUrl: string | null;
  pdfGeneratedAt: string | null;
  generatedAt: string;
  activatedAt: string | null;
  voidedAt: string | null;
  signatures: Array<{
    signerRole: string;
    signerName: string | null;
    signedAt: string;
    ipAddress: string;
    declaration: string;
  }>;
};

interface ContractPageClientProps {
  contract: ContractPayload;
  isMentor: boolean;
  userId: string;
}

function hoursRemaining(deadline: string | null): number | null {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (60 * 60 * 1000)));
}

export function ContractPageClient({
  contract,
  isMentor,
  userId: _userId,
}: ContractPageClientProps) {
  void _userId;
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const status = contract.status as ContractStatus;
  const content = contract.contractContent;

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setScrolledToBottom(scrollHeight - scrollTop - clientHeight < 20);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll);
    return () => el.removeEventListener("scroll", checkScroll);
  }, [checkScroll]);

  const mentorDeadlineHours = hoursRemaining(contract.mentorSignDeadline);
  const menteeDeadlineHours = hoursRemaining(contract.menteeSignDeadline);

  const handleRequestOTP = async () => {
    const res = await fetch(`/api/mentorship/contracts/${contract.id}/request-otp`, {
      method: "POST",
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error ?? "Failed to send code");
    }
  };

  const handleSubmitOTP = async (
    otp: string
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await fetch(`/api/mentorship/contracts/${contract.id}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { success: true };
    return {
      success: false,
      error: data.code === "INVALID_OTP" ? "Invalid code" : data.code === "OTP_EXPIRED" ? "Code expired" : data.error ?? "Failed",
    };
  };

  const handleDownload = async () => {
    const res = await fetch(`/api/mentorship/contracts/${contract.id}/download`);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      if (d.code === "CONTRACT_FLAGGED") {
        return;
      }
      alert("Download not available");
      return;
    }
    const { url } = await res.json();
    window.open(url, "_blank");
  };

  const canSignMentor =
    status === "PENDING_MENTOR_SIGNATURE" &&
    isMentor &&
    mentorDeadlineHours !== null &&
    mentorDeadlineHours > 0;
  const canSignMentee =
    status === "PENDING_MENTEE_SIGNATURE" &&
    !isMentor &&
    menteeDeadlineHours !== null &&
    menteeDeadlineHours > 0;

  if (!content) {
    return (
      <div>
        <p className="text-muted-foreground">Contract data unavailable.</p>
        <Link href="/mentorship" className="text-[#16A34A] underline">Return to Mentorship</Link>
      </div>
    );
  }

  const openOtpModal = () => {
    setRequestingOtp(true);
    handleRequestOTP()
      .then(() => setOtpOpen(true))
      .catch((e) => alert(e.message))
      .finally(() => setRequestingOtp(false));
  };

  if (status === "DISPUTED") {
    return (
      <div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-6">
          <p className="font-medium text-red-800">
            This contract has been flagged for integrity review. Your engagement has been
            suspended pending ops review. You have been notified by email.
          </p>
        </div>
        <Link href="/mentorship" className="text-[#16A34A] underline">
          Return to Mentorship
        </Link>
      </div>
    );
  }

  if (status === "VOID") {
    return (
      <div>
        <h1 className="text-xl font-bold text-[#0F1A0F] mb-4">
          This engagement contract was voided
        </h1>
        <p className="text-muted-foreground mb-4">
          The contract was voided because the signing deadline passed before both parties
          signed.
        </p>
        <Link href="/mentorship" className="text-[#16A34A] underline">
          Return to Mentorship
        </Link>
      </div>
    );
  }

  return (
    <>
      {status === "ACTIVE" && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 mb-6">
          <p className="font-medium text-green-800">Contract active</p>
        </div>
      )}

      {status === "PENDING_MENTOR_SIGNATURE" && !isMentor && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6">
          <p className="font-medium text-amber-800">
            Waiting for your mentor to sign. You&apos;ll receive an email when it&apos;s your
            turn.
          </p>
          {contract.mentorSignDeadline && (
            <p className="text-sm mt-1">
              If the mentor does not sign within {mentorDeadlineHours ?? 0} hours, this
              engagement will be voided.
            </p>
          )}
        </div>
      )}

      {status === "PENDING_MENTEE_SIGNATURE" && isMentor && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-6">
          <p className="font-medium text-[#0F1A0F]">Contract signed. Waiting for your mentee to sign.</p>
          {contract.menteeSignDeadline && (
            <p className="text-sm mt-1">Sign deadline: {menteeDeadlineHours ?? 0} hours remaining.</p>
          )}
        </div>
      )}

      {status === "PENDING_MENTEE_SIGNATURE" && !isMentor && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6">
          <p className="font-medium text-amber-800">
            Your mentor has signed. Please review and sign to begin your engagement.
          </p>
          {contract.menteeSignDeadline && (
            <p className="text-sm mt-1">Sign deadline: {menteeDeadlineHours ?? 0} hours remaining.</p>
          )}
        </div>
      )}

      <h1 className="text-xl font-bold text-[#0F1A0F] mb-4">Engagement contract</h1>

      <div
        ref={scrollRef}
        className="overflow-y-auto max-h-[60vh] border border-gray-200 rounded-lg bg-white p-6 mb-6"
        style={{ overflowY: "scroll" }}
      >
        <section className="mb-4">
          <h2 className="text-sm font-semibold text-[#0F1A0F] mb-2">Parties</h2>
          <p>
            <strong>Mentor:</strong> {content.mentor.fullName} — {content.mentor.verifiedRole} ({content.mentor.email})
          </p>
          <p>
            <strong>Mentee:</strong> {content.mentee.fullName} — Target: {content.mentee.targetRole}, Current: {content.mentee.currentRole} ({content.mentee.email})
          </p>
        </section>
        <section className="mb-4">
          <h2 className="text-sm font-semibold text-[#0F1A0F] mb-2">Engagement scope</h2>
          <p><strong>Goal:</strong> {content.engagementScope.goal}</p>
          <p><strong>Commitment:</strong> {content.engagementScope.commitment}</p>
          <p><strong>Timeline:</strong> {content.engagementScope.timeline}</p>
          <p>
            {content.engagementScope.engagementType} — {content.engagementScope.sessionCount} sessions, {content.engagementScope.sessionFrequency}, {content.engagementScope.sessionDurationMins} min each.
          </p>
        </section>
        <section className="mb-4">
          <h2 className="text-sm font-semibold text-[#0F1A0F] mb-2">Terms</h2>
          {Object.entries(content.clauses).map(([key, text]) => (
            <div key={key} className="mb-2">
              <p className="text-xs font-medium text-gray-600">{key}</p>
              <p className="text-sm whitespace-pre-wrap">{text}</p>
            </div>
          ))}
        </section>
        <section>
          <p className="text-xs text-gray-500">
            Governing law: {content.governingLaw.acts.join(", ")}. Jurisdiction: {content.governingLaw.jurisdiction}.
          </p>
          <p className="text-xs text-gray-500 mt-1">T&C version: {content.tcVersion}. Generated: {content.generatedAt}</p>
        </section>
      </div>

      {contract.signatures.length > 0 && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-sm font-semibold mb-2">Signatures</h3>
          {contract.signatures.map((s, i) => (
            <p key={i} className="text-sm">
              {s.signerName} ({s.signerRole}) — {new Date(s.signedAt).toLocaleString()} — {s.declaration}
            </p>
          ))}
        </div>
      )}

      {canSignMentor && (
        <div className="mb-4">
          <p className="text-sm text-amber-600 mb-2">
            Sign deadline: {mentorDeadlineHours} hours remaining.
          </p>
          <button
            type="button"
            onClick={openOtpModal}
            disabled={!scrolledToBottom || requestingOtp}
            className="px-4 py-2 rounded-lg bg-[#16A34A] text-white font-medium disabled:opacity-50"
          >
            {requestingOtp ? "Sending code…" : scrolledToBottom ? "Sign contract" : "Scroll to bottom to enable signing"}
          </button>
        </div>
      )}

      {canSignMentee && (
        <div className="mb-4">
          <p className="text-sm text-amber-600 mb-2">
            Sign deadline: {menteeDeadlineHours} hours remaining.
          </p>
          <button
            type="button"
            onClick={openOtpModal}
            disabled={!scrolledToBottom || requestingOtp}
            className="px-4 py-2 rounded-lg bg-[#16A34A] text-white font-medium disabled:opacity-50"
          >
            {requestingOtp ? "Sending code…" : scrolledToBottom ? "Sign contract" : "Scroll to bottom to enable signing"}
          </button>
        </div>
      )}

      {(status === "ACTIVE" || status === "COMPLETED") && contract.pdfUrl && (
        <button
          type="button"
          onClick={handleDownload}
          className="px-4 py-2 rounded-lg border border-[#0F1A0F] text-[#0F1A0F] font-medium"
        >
          Download PDF
        </button>
      )}

      <div className="mt-6">
        <Link href="/mentorship" className="text-[#16A34A] underline">
          Return to Mentorship
        </Link>
      </div>

      <ContractOTPModal
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        maskedEmail={isMentor ? content.mentor.email : content.mentee.email}
        onRequestOTP={handleRequestOTP}
        onSubmitOTP={handleSubmitOTP}
      />
    </>
  );
}
