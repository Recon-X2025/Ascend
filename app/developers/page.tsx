import Link from "next/link";
import { Container } from "@/components/layout/Container";

export const metadata = {
  title: "Developer Portal — Ascend API",
  description: "Build with the Ascend API. Jobs, applications, candidates, webhooks.",
};

export default function DevelopersPage() {
  return (
    <Container className="py-16">
      <h1 className="text-3xl font-display font-bold text-ink">
        Ascend Developer Portal
      </h1>
      <p className="mt-4 text-lg text-ink-2 max-w-2xl">
        The Ascend API lets you integrate job posting, applicant tracking, and
        candidate management into your workflows. Enterprise plans required.
      </p>

      <nav className="mt-12 flex flex-wrap gap-6">
        <Link
          href="/developers/reference"
          className="text-green font-medium hover:underline"
        >
          API Reference →
        </Link>
        <Link
          href="/developers/webhooks"
          className="text-green font-medium hover:underline"
        >
          Webhooks →
        </Link>
        <Link
          href="/developers/changelog"
          className="text-green font-medium hover:underline"
        >
          Changelog →
        </Link>
      </nav>

      <section className="mt-16 prose prose-invert max-w-none">
        <h2>Authentication</h2>
        <p>
          Use API keys (Bearer token). Create keys in your company dashboard.
          Format: <code>asc_live_xxxx</code> (live) or <code>asc_test_xxxx</code>{" "}
          (test).
        </p>

        <h2>Rate limits</h2>
        <p>1,000 requests per hour per API key (sliding window).</p>

        <h2>Environments</h2>
        <p>Use test keys for development. Live keys affect production data.</p>
      </section>
    </Container>
  );
}
