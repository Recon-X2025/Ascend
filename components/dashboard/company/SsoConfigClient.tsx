"use client";

export function SsoConfigClient() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink">SSO / SAML</h1>
      <p className="text-ink-2">
        Configure SAML SSO for your organization. Enterprise plan required. Config submitted here
        will be reviewed by the Ascend team before activation.
      </p>
      <div className="rounded-lg border border-border p-6 bg-surface-2">
        <p className="text-ink-3 text-sm">Status: Pending activation by Ascend team</p>
        <p className="mt-2 text-ink-4 text-sm">
          Submit your IdP details (entry point URL, certificate, issuer) via support.
        </p>
      </div>
    </div>
  );
}
