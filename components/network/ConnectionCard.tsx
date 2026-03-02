"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, User } from "lucide-react";

export interface ConnectionCardUser {
  id: string;
  name: string | null;
  image: string | null;
  headline: string | null;
  currentRole: string | null;
  currentCompany: string | null;
  username: string | null;
}

interface ConnectionCardProps {
  user: ConnectionCardUser;
  mutualCount?: number;
  status?: "none" | "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";
  isRequester?: boolean;
  connectionId?: string | null;
  onConnect?: (userId: string) => void;
  onRespond?: (connectionId: string, action: "accept" | "decline") => void;
  connectLoading?: boolean;
}

export function ConnectionCard({
  user,
  mutualCount = 0,
  status = "none",
  isRequester,
  connectionId,
  onConnect,
  onRespond,
  connectLoading,
}: ConnectionCardProps) {
  const profileUrl = user.username ? `/profile/${user.username}` : "#";
  const initials = (user.name ?? "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="ascend-card p-4 flex items-start gap-4">
      <Link href={profileUrl} className="shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.image ?? undefined} alt="" />
          <AvatarFallback className="bg-muted text-muted-foreground">{initials}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={profileUrl} className="font-medium text-foreground hover:underline">
          {user.name ?? "User"}
        </Link>
        {(user.headline || user.currentRole) && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
            {user.currentRole ?? user.headline}
            {user.currentCompany && ` at ${user.currentCompany}`}
          </p>
        )}
        {mutualCount > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {mutualCount} mutual connection{mutualCount !== 1 ? "s" : ""}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          {status === "none" && onConnect && (
            <Button
              size="sm"
              onClick={() => onConnect(user.id)}
              disabled={connectLoading}
            >
              Connect
            </Button>
          )}
          {status === "PENDING" && connectionId && (
            <>
              {isRequester ? (
                <span className="text-sm text-muted-foreground">Pending</span>
              ) : (
                onRespond && (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onRespond(connectionId, "accept")}
                      disabled={connectLoading}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRespond(connectionId, "decline")}
                      disabled={connectLoading}
                    >
                      Decline
                    </Button>
                  </>
                )
              )}
            </>
          )}
          {status === "ACCEPTED" && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/messages?with=${user.id}`}>
                <MessageCircle className="h-4 w-4 mr-1" />
                Message
              </Link>
            </Button>
          )}
          <Button size="sm" variant="ghost" asChild>
            <Link href={profileUrl}>
              <User className="h-4 w-4 mr-1" />
              View profile
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
