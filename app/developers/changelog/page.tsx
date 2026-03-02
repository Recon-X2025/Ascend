import { Container } from "@/components/layout/Container";

export const metadata = {
  title: "API Changelog — Ascend",
  description: "API version history and changes.",
};

export default function DevelopersChangelogPage() {
  return (
    <Container className="py-16">
      <h1 className="text-3xl font-display font-bold text-ink">
        API Changelog
      </h1>

      <section className="mt-12 space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-ink">v1.0.0 (Phase 18)</h2>
          <p className="mt-2 text-ink-2">Initial release.</p>
          <ul className="mt-2 text-ink-2 list-disc pl-6 space-y-1">
            <li>Jobs CRUD</li>
            <li>Applications list, get, update status</li>
            <li>Candidates list, get</li>
            <li>Webhooks registration</li>
            <li>Bulk job import, application export</li>
          </ul>
        </div>
      </section>
    </Container>
  );
}
