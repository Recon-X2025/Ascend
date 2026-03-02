"use client";

import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ContractItem = {
  id: string;
  status: string;
  mentorSignDeadline: string | null;
  menteeSignDeadline: string | null;
  otherPartyFirstName: string;
  engagementType: string;
};

function hoursRemaining(deadline: string | null): number | null {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (60 * 60 * 1000)));
}

export function ContractsAwaitingSignatureWidget() {
  const { data } = useSWR<{ contracts: ContractItem[] }>(
    "/api/mentorship/contracts",
    fetcher
  );
  const pending =
    data?.contracts?.filter((c) => c.status === "PENDING_MENTOR_SIGNATURE") ?? [];

  if (pending.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6">
      <h3 className="font-semibold text-[#0F1A0F] mb-3">
        Contracts awaiting your signature
      </h3>
      <ul className="space-y-2">
        {pending.map((c) => {
          const hours = hoursRemaining(c.mentorSignDeadline);
          return (
            <li
              key={c.id}
              className="flex items-center justify-between gap-4 flex-wrap"
            >
              <span className="text-sm">
                {c.otherPartyFirstName} — {c.engagementType}
              </span>
              <span className="text-xs text-amber-700">
                {hours !== null ? `${hours}h left` : "Expired"}
              </span>
              <Link
                href={`/mentorship/contracts/${c.id}`}
                className="text-sm font-medium text-[#16A34A] hover:underline"
              >
                Review &amp; sign
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
