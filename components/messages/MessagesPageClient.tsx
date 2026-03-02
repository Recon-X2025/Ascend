"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

type Conversation = {
  id: string;
  other: { id: string; name: string | null; image: string | null };
  lastMessage: { body: string; fromMe: boolean } | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

type Message = {
  id: string;
  body: string;
  senderId: string;
  sender: { id: string; name: string | null; image: string | null };
  createdAt: string;
  readAt: string | null;
};

export function MessagesPageClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [other, setOther] = useState<{ id: string; name: string | null; image: string | null } | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/messages/conversations")
      .then((r) => r.json())
      .then((d) => d.success && setConversations(d.data ?? []));
  }, []);

  useEffect(() => {
    const withUser = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("with") : null;
    if (withUser && conversations.length) {
      const conv = conversations.find(
        (c) => c.other.id === withUser
      );
      if (conv) setSelectedId(conv.id);
    }
  }, [conversations]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setOther(null);
      return;
    }
    fetch(`/api/messages/conversations/${selectedId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setMessages(d.data.messages ?? []);
          setOther(d.data.other ?? null);
        }
      });
  }, [selectedId]);

  const sendMessage = async () => {
    const body = input.trim();
    if (!body || !selectedId || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const d = await res.json();
      if (d.success) {
        setInput("");
        setMessages((prev) => [...prev, { ...d.data, readAt: null }]);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[60vh]">
      <div className="w-full lg:w-80 shrink-0 border border-border rounded-xl overflow-hidden">
        <div className="p-3 border-b border-border bg-muted/30">
          <Link href="/messages/new">
            <Button size="sm" className="w-full">New message</Button>
          </Link>
        </div>
        <div className="divide-y divide-border max-h-[50vh] overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50"
                onClick={() => setSelectedId(c.id)}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={c.other.image ?? undefined} alt="" />
                  <AvatarFallback className="text-xs">
                    {(c.other.name ?? "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{c.other.name ?? "User"}</p>
                  {c.lastMessage && (
                    <p className="text-xs text-muted-foreground truncate">
                      {c.lastMessage.fromMe ? "You: " : ""}{c.lastMessage.body}
                    </p>
                  )}
                </div>
                {c.unreadCount > 0 && (
                  <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {c.unreadCount}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 border border-border rounded-xl flex flex-col min-h-[400px]">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a conversation or start a new message.
          </div>
        ) : (
          <>
            {other && (
              <div className="p-3 border-b border-border flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={other.image ?? undefined} alt="" />
                  <AvatarFallback className="text-xs">{(other.name ?? "?").slice(0, 2)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{other.name ?? "User"}</span>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.senderId === other?.id ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      m.senderId === other?.id
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <input
                type="text"
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              />
              <Button size="icon" onClick={sendMessage} disabled={sending || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
