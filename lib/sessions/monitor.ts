/**
 * M-7: Message scan for off-platform solicitation.
 * Strike system: 1st=warning, 2nd=suspend, 3rd=terminate.
 */

import { prisma } from "@/lib/prisma/client";
import type { MessageFlagType } from "@prisma/client";

const PATTERNS: { type: MessageFlagType; regex: RegExp }[] = [
  {
    type: "EXTERNAL_EMAIL",
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  },
  {
    type: "PHONE_NUMBER",
    regex: /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}|\d{10,}/g,
  },
  {
    type: "EXTERNAL_VIDEO_LINK",
    regex: /(meet\.google\.com|zoom\.us|teams\.microsoft\.com|whereby\.com|calendly\.com\/[^\s]+)/gi,
  },
  {
    type: "PAYMENT_SOLICITATION",
    regex: /(paypal\.me|venmo\.com|pay\.me|gpay|phonepe|bhim|upi@|gpay\.to)/gi,
  },
];

export interface ScanResult {
  flags: { type: MessageFlagType; match: string }[];
  flagged: boolean;
}

/** Scan message text for off-platform patterns. */
export function scanMessageText(messageText: string): ScanResult {
  const flags: { type: MessageFlagType; match: string }[] = [];
  for (const { type, regex } of PATTERNS) {
    const matches = messageText.match(regex);
    if (matches) {
      for (const m of matches) {
        flags.push({ type, match: m });
      }
    }
  }
  return { flags, flagged: flags.length > 0 };
}

/** Persist flags and apply strike system. Fire-and-forget safe. */
export async function scanMessage(
  contractId: string,
  senderId: string,
  messageId: string,
  messageText: string
): Promise<ScanResult> {
  const { flags, flagged } = scanMessageText(messageText);
  if (!flagged) return { flags: [], flagged: false };

  try {
    for (const f of flags) {
      await prisma.messageFlag.create({
        data: {
          contractId,
          messageId,
          senderId,
          flagType: f.type,
        },
      });
    }

    const count = await prisma.messageFlag.count({
      where: { contractId, senderId },
    });

    if (count === 1) {
      // 1st = warning — could send session-off-platform-warning email
      // We don't have a direct way to "warn" — outcome event + optional email
    } else if (count === 2) {
      // 2nd = suspend — would require contract/engagement suspension
      // Placeholder: create ops alert
      const { createOpsAlert } = await import("@/lib/mentorship/ops-alerts");
      await createOpsAlert(
        "STENO_FAILURE", // reuse or add OFF_PLATFORM_SUSPEND
        "MentorshipContract",
        contractId,
        `Off-platform solicitation (2nd strike): sender ${senderId}, message ${messageId}`,
        "HIGH"
      );
    } else if (count >= 3) {
      // 3rd = terminate — would require contract termination
      const { createOpsAlert } = await import("@/lib/mentorship/ops-alerts");
      await createOpsAlert(
        "STENO_FAILURE",
        "MentorshipContract",
        contractId,
        `Off-platform solicitation (3rd+ strike): sender ${senderId}, message ${messageId}`,
        "CRITICAL"
      );
    }
  } catch (e) {
    console.error("[Monitor] scanMessage error:", e);
  }

  return { flags, flagged: true };
}
