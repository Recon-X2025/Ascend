"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import toast from "react-hot-toast";

type EntityType = "JOB" | "COMPANY" | "PROFILE" | "SALARY_INSIGHT" | "MENTOR";
type Channel = "COPY_LINK" | "WHATSAPP" | "LINKEDIN" | "TWITTER" | "EMAIL";

interface ShareButtonProps {
  entityType: EntityType;
  entityId: string;
  url: string;
  title?: string;
  className?: string;
  variant?: "button" | "icon";
}

export function ShareButton({
  entityType,
  entityId,
  url,
  title = "Check this out",
  className,
  variant = "icon",
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  const share = useCallback(
    async (channel: Channel) => {
      try {
        const res = await fetch("/api/growth/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entityType, entityId, channel }),
        });
        const data = await res.json();
        const shareUrl = data.url ?? url;

        if (channel === "COPY_LINK") {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Copied!");
          setOpen(false);
          return;
        }

        if (channel === "WHATSAPP") {
          window.open(
            `https://wa.me/?text=${encodeURIComponent(shareUrl)}`,
            "_blank",
            "noopener,noreferrer"
          );
        } else if (channel === "LINKEDIN") {
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
            "_blank",
            "noopener,noreferrer"
          );
        } else if (channel === "TWITTER") {
          window.open(
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
            "_blank",
            "noopener,noreferrer"
          );
        } else if (channel === "EMAIL") {
          window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareUrl)}`;
        }
        setOpen(false);
      } catch {
        toast.error("Failed to share");
      }
    },
    [entityType, entityId, url, title]
  );

  const handleNativeShare = useCallback(async () => {
    try {
      const res = await fetch("/api/growth/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, channel: "COPY_LINK" }),
      });
      const data = await res.json();
      const shareUrl = data.url ?? url;
      if (navigator.share) {
        await navigator.share({
          url: shareUrl,
          title,
          text: title,
        });
        toast.success("Shared!");
        setOpen(false);
      } else {
        await share("COPY_LINK");
      }
    } catch {
      await share("COPY_LINK");
    }
  }, [entityType, entityId, url, title, share]);

  const trigger =
    variant === "icon" ? (
      <Button
        variant="ghost"
        size="icon"
        className={className}
        aria-label="Share"
      >
        <Share2 className="h-4 w-4" />
      </Button>
    ) : (
      <Button variant="outline" size="sm" className={className}>
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>
    );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canNativeShare && (
          <DropdownMenuItem onClick={handleNativeShare}>
            Share (device)
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => share("COPY_LINK")}>
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => share("WHATSAPP")}>
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => share("LINKEDIN")}>
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => share("TWITTER")}>
          Twitter / X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => share("EMAIL")}>
          Email
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
