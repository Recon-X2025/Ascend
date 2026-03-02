"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsListClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

  const load = async (nextCursor?: string | null) => {
    const url = nextCursor
      ? `/api/notifications?limit=20&cursor=${nextCursor}`
      : "/api/notifications?limit=20";
    const res = await fetch(url);
    const data = await res.json();
    const list = data.notifications ?? [];
    setNotifications((prev) => (nextCursor ? [...prev, ...list] : list));
    setCursor(data.nextCursor ?? null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    await fetch("/api/notifications/read", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground py-8">Loading...</div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground">You&apos;re all caught up.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`flex items-start gap-3 p-4 rounded-lg border ${
            !n.isRead ? "bg-blue-500/5 border-blue-500/20" : "border-border"
          }`}
        >
          <div className="flex-1 min-w-0">
            {n.linkUrl ? (
              <Link
                href={n.linkUrl}
                className="font-medium hover:text-primary block"
                onClick={() => !n.isRead && markRead(n.id)}
              >
                {n.title}
              </Link>
            ) : (
              <p className="font-medium">{n.title}</p>
            )}
            {n.body && (
              <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
            </p>
          </div>
          {!n.isRead && (
            <button
              type="button"
              onClick={() => markRead(n.id)}
              className="text-xs text-primary hover:underline shrink-0"
            >
              Mark read
            </button>
          )}
        </div>
      ))}
      {cursor && (
        <button
          type="button"
          onClick={() => load(cursor)}
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground"
        >
          Load more
        </button>
      )}
    </div>
  );
}
