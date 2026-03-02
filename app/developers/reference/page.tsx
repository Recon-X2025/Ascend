import { Container } from "@/components/layout/Container";

export const metadata = {
  title: "API Reference — Ascend",
  description: "REST API v1 reference. Jobs, applications, candidates, webhooks, bulk.",
};

export default function DevelopersReferencePage() {
  return (
    <Container className="py-16">
      <h1 className="text-3xl font-display font-bold text-ink">API Reference</h1>
      <p className="mt-4 text-ink-2">
        Base URL: <code>https://ascend.app/api/v1</code>
      </p>

      <section className="mt-12 space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-ink">Jobs</h2>
          <ul className="mt-2 text-ink-2 list-disc pl-6 space-y-1">
            <li>GET /jobs — List jobs (paginated)</li>
            <li>GET /jobs/[id] — Get job</li>
            <li>POST /jobs — Create job</li>
            <li>PATCH /jobs/[id] — Update job</li>
            <li>DELETE /jobs/[id] — Close job</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-ink">Applications</h2>
          <ul className="mt-2 text-ink-2 list-disc pl-6 space-y-1">
            <li>GET /applications — List applications</li>
            <li>GET /applications/[id] — Get application</li>
            <li>PATCH /applications/[id] — Update status</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-ink">Candidates</h2>
          <ul className="mt-2 text-ink-2 list-disc pl-6 space-y-1">
            <li>GET /candidates — List candidates</li>
            <li>GET /candidates/[id] — Get candidate</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-ink">Webhooks</h2>
          <ul className="mt-2 text-ink-2 list-disc pl-6 space-y-1">
            <li>GET /webhooks — List webhooks</li>
            <li>POST /webhooks — Create webhook</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-ink">Bulk</h2>
          <ul className="mt-2 text-ink-2 list-disc pl-6 space-y-1">
            <li>POST /bulk/jobs/import — Import jobs (CSV/JSON)</li>
            <li>GET /bulk/jobs/import/[id] — Import status</li>
            <li>GET /bulk/applications/export — Export applications (CSV)</li>
          </ul>
        </div>
      </section>
    </Container>
  );
}
