"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { REPORT_DESCRIPTION_MAX } from "@/lib/validations/report";

const REPORT_REASONS = [
  { value: "SPAM", label: "Spam" },
  { value: "MISLEADING", label: "Misleading" },
  { value: "INAPPROPRIATE", label: "Inappropriate content" },
  { value: "FAKE", label: "Fake or fraudulent" },
  { value: "HARASSMENT", label: "Harassment" },
  { value: "OTHER", label: "Other" },
] as const;

type ReportTargetType =
  | "JOB_POST"
  | "COMPANY_REVIEW"
  | "USER_PROFILE"
  | "MESSAGE"
  | "MENTOR_PROFILE";

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
  /** When false, nothing is rendered (e.g. unauthenticated or content owner). */
  canReport?: boolean;
  className?: string;
}

export function ReportButton({
  targetType,
  targetId,
  canReport = true,
  className,
}: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "rate_limited" | "error">("idle");

  if (!canReport) return null;

  const submit = async () => {
    if (!reason) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          description: description.trim() || undefined,
        }),
      });
      await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("success");
        setReason("");
        setDescription("");
        setTimeout(() => setOpen(false), 1500);
      } else if (res.status === 429) {
        setStatus("rate_limited");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className ?? "h-8 w-8 text-muted-foreground hover:text-foreground"}
          aria-label="Report"
        >
          <Flag className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Report content</SheetTitle>
          <SheetDescription>
            Tell us what’s wrong. Our team will review this.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="report-reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="report-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="report-desc">
              Additional details (optional)
              <span className="ml-1 text-muted-foreground font-normal">
                {description.length}/{REPORT_DESCRIPTION_MAX}
              </span>
            </Label>
            <Textarea
              id="report-desc"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value.slice(0, REPORT_DESCRIPTION_MAX))
              }
              placeholder="Any extra context for our team..."
              rows={3}
              className="resize-none"
            />
          </div>
          {status === "rate_limited" && (
            <p className="text-sm text-amber-600">
              You&apos;ve submitted several reports recently. Please wait before
              submitting another.
            </p>
          )}
          {status === "success" && (
            <p className="text-sm text-green-600">
              Thank you — our team will review this.
            </p>
          )}
          {status === "error" && (
            <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
          )}
        </div>
        <SheetFooter>
          <Button
            type="button"
            onClick={submit}
            disabled={!reason || status === "submitting"}
          >
            {status === "submitting" ? "Submitting…" : "Submit report"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
