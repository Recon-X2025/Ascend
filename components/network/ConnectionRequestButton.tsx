"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import Link from "next/link";

interface StatusData {
  status: "none" | "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";
  connectionId: string | null;
  isRequester: boolean | null;
}

interface ConnectionRequestButtonProps {
  userId: string;
  onConnect?: (userId: string) => void;
  connectLoading?: boolean;
}

export function ConnectionRequestButton({
  userId,
  onConnect,
  connectLoading,
}: ConnectionRequestButtonProps) {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/connections/status/${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((res) => res.success && res.data && setData(res.data))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading || !data) {
    return <Button size="sm" variant="outline" disabled>…</Button>;
  }
  if (data.status === "none" && onConnect) {
    return (
      <Button size="sm" onClick={() => onConnect(userId)} disabled={connectLoading}>
        Connect
      </Button>
    );
  }
  if (data.status === "PENDING") {
    return (
      <Button size="sm" variant="outline" disabled>
        {data.isRequester ? "Pending" : "Respond to request"}
      </Button>
    );
  }
  if (data.status === "ACCEPTED") {
    return (
      <Button size="sm" variant="outline" asChild>
        <Link href={`/messages?with=${userId}`}>
          <MessageCircle className="h-4 w-4 mr-1" />
          Message
        </Link>
      </Button>
    );
  }
  return null;
}
