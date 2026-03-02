"use client";

type Status = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REVERIFICATION_REQUIRED";

interface VerificationStatusBannerProps {
  status: Status;
  verifiedAt?: string | null;
  nextReviewDue?: string | null;
}

export function VerificationStatusBanner({
  status,
  verifiedAt,
  nextReviewDue,
}: VerificationStatusBannerProps) {
  if (status === "UNVERIFIED") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4">
        <p className="font-medium text-amber-800 dark:text-amber-200">
          Your profile is not yet verified. Complete verification to appear in mentor discovery.
        </p>
      </div>
    );
  }

  if (status === "PENDING") {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-4">
        <p className="font-medium text-blue-800 dark:text-blue-200">
          Your documents are under review. We&apos;ll notify you within 48 hours.
        </p>
      </div>
    );
  }

  if (status === "VERIFIED") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-4">
        <p className="font-medium text-green-800 dark:text-green-200">
          ✓ Verified — your profile is discoverable.
        </p>
        {verifiedAt && (
          <p className="mt-1 text-sm text-green-700 dark:text-green-300">
            Verified on {new Date(verifiedAt).toLocaleDateString()}
            {nextReviewDue && (
              <> · Next review due {new Date(nextReviewDue).toLocaleDateString()}</>
            )}
          </p>
        )}
      </div>
    );
  }

  if (status === "REVERIFICATION_REQUIRED") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4">
        <p className="font-medium text-amber-800 dark:text-amber-200">
          Your verification has expired. Please re-submit to stay discoverable.
        </p>
      </div>
    );
  }

  return null;
}
