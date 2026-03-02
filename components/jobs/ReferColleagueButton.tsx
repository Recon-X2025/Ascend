"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { UserPlus } from "lucide-react";

interface ReferColleagueButtonProps {
  jobId: number;
  jobSlug: string;
  jobTitle: string;
  companyName: string;
  canRefer: boolean;
}

export function ReferColleagueButton({
  jobId,
  jobSlug,
  jobTitle,
  companyName,
  canRefer,
}: ReferColleagueButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!canRefer) return null;

  const submit = async () => {
    if (!name.trim() || !email.trim()) return;
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/refer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referredName: name.trim(), referredEmail: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("success");
        setName("");
        setEmail("");
        setTimeout(() => { setOpen(false); setStatus("idle"); }, 1500);
      } else {
        setStatus("error");
        setError(data.error ?? "Failed to send referral");
      }
    } catch {
      setStatus("error");
      setError("Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <UserPlus className="h-4 w-4" />
          Refer a Colleague
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refer a Colleague</DialogTitle>
          <DialogDescription>
            Send {companyName}&apos;s <strong>{jobTitle}</strong> role to someone you think would be a great fit.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="ref-name">Colleague&apos;s name</Label>
            <Input
              id="ref-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="ref-email">Colleague&apos;s email</Label>
            <Input
              id="ref-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="mt-1"
            />
          </div>
          {status === "error" && error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {status === "success" && (
            <p className="text-sm text-green-600">
              Referral sent. They&apos;ll receive an email with the job link.{" "}
              <Link href={`/jobs/${jobSlug}`} className="underline">View job</Link>
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={status === "submitting" || !name.trim() || !email.trim()}>
            {status === "submitting" ? "Sending…" : "Send Referral"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
