"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import toast from "react-hot-toast";

export function InviteTeammatesCard() {
  const [emails, setEmails] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = emails.trim();
    if (!trimmed) {
      toast.error("Enter at least one email");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/growth/recruiter-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send invites");
        return;
      }
      toast.success(`Invite${data.sent !== 1 ? "s" : ""} sent to ${data.sent} recipient${data.sent !== 1 ? "s" : ""}`);
      setEmails("");
    } catch {
      toast.error("Failed to send invites");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Invite Teammates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground mb-3">
          Grow your hiring team on Ascend — invite colleagues to join.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="email@company.com, another@company.com"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            className="flex-1 min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={loading}
          />
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Sending…" : "Send invite"}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          Up to 10 invites per day. They’ll get a link to join Ascend.
        </p>
      </CardContent>
    </Card>
  );
}
