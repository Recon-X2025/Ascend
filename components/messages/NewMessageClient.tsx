"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewMessageClient() {
  const router = useRouter();
  const [recipientId, setRecipientId] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    const id = recipientId.trim();
    const text = body.trim();
    if (!id || !text) {
      setError("Enter recipient user ID and message.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: id, body: text }),
      });
      const data = await res.json();
      if (data.success && data.data?.conversationId) {
        router.push(`/messages?conversation=${data.data.conversationId}`);
      } else {
        setError(data.message ?? data.error ?? "Failed to send.");
      }
    } catch {
      setError("Failed to send.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md space-y-4">
      <p className="text-sm text-muted-foreground">
        Start a conversation. Use the user ID of the person you want to message (find it from their profile URL or ask them).
      </p>
      <div>
        <label className="block text-sm font-medium mb-1">Recipient user ID</label>
        <Input
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
          placeholder="e.g. clxx..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Message</label>
        <textarea
          className="w-full min-h-[120px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type your message..."
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={send} disabled={loading}>
        {loading ? "Sending…" : "Send message"}
      </Button>
    </div>
  );
}
