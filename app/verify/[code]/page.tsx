/**
 * BL-14: Public certificate verification page.
 */
import { verifyCertificate } from "@/lib/mentorship/certificates";
import { notFound } from "next/navigation";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const result = await verifyCertificate(code);
  if (!result.valid) notFound();
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-bold">Certificate Verified</h1>
      <p className="mt-4 text-gray-600">
        This certificate has been verified by Ascend Career Navigation Platform.
      </p>
      <dl className="mt-6 space-y-2">
        <dt className="font-medium">Mentee</dt>
        <dd>{result.menteeName ?? "—"}</dd>
        <dt className="mt-4 font-medium">Mentor</dt>
        <dd>{result.mentorName ?? "—"}</dd>
        {result.transitionType && (
          <>
            <dt className="mt-4 font-medium">Transition</dt>
            <dd>{result.transitionType}</dd>
          </>
        )}
        {result.claimedOutcome && (
          <>
            <dt className="mt-4 font-medium">Outcome</dt>
            <dd>{result.claimedOutcome}</dd>
          </>
        )}
        {result.issuedAt && (
          <>
            <dt className="mt-4 font-medium">Issued</dt>
            <dd>{new Date(result.issuedAt).toLocaleDateString()}</dd>
          </>
        )}
      </dl>
      <p className="mt-8 text-sm text-gray-500">Verification code: {code}</p>
    </div>
  );
}
