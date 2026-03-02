import { Container } from "@/components/layout/Container";

export const metadata = {
  title: "Webhooks — Ascend API",
  description: "Outbound webhook events, payload schemas, signature verification.",
};

export default function DevelopersWebhooksPage() {
  return (
    <Container className="py-16">
      <h1 className="text-3xl font-display font-bold text-ink">
        Webhook Events
      </h1>
      <p className="mt-4 text-ink-2">
        Subscribe to events. We send payloads with HMAC-SHA256 signature in{" "}
        <code>X-Ascend-Signature</code> header.
      </p>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-ink">Events</h2>
        <ul className="mt-4 space-y-2 text-ink-2">
          <li>
            <code>application.created</code> — New application submitted
          </li>
          <li>
            <code>application.status_changed</code> — Status updated
          </li>
          <li>
            <code>job.created</code> — Job post created
          </li>
          <li>
            <code>job.closed</code> — Job closed
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-ink mt-8">
          Signature verification
        </h2>
        <p className="mt-2 text-ink-2">
          Use your webhook secret to verify the <code>X-Ascend-Signature</code>{" "}
          header. Computed as HMAC-SHA256 of the raw body.
        </p>
      </section>
    </Container>
  );
}
