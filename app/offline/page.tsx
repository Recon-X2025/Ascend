import Link from "next/link";
import { Container } from "@/components/layout/Container";

export default function OfflinePage() {
  return (
    <Container className="py-16 text-center">
      <h1 className="text-2xl font-semibold text-foreground">You&apos;re offline</h1>
      <p className="mt-2 text-muted-foreground">
        Your saved jobs and profile are available when you’re back online.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Try again when you have a connection, or{" "}
        <Link href="/" className="text-primary hover:underline">
          go to home
        </Link>
        .
      </p>
    </Container>
  );
}
