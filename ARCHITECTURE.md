# Ascend — Architecture Overview

## Stack

| Layer | Technology | Hosting |
|-------|------------|---------|
| Frontend + API | Next.js 14 (App Router) | Vercel |
| Database | PostgreSQL + Prisma ORM | Vultr Managed PostgreSQL |
| Cache + Queues | Redis + BullMQ | Vultr Managed Redis |
| AI | Anthropic Claude (claude-sonnet-4-5) | Anthropic API |
| Search | Typesense | Typesense Cloud |
| Object Storage | S3-compatible | Vultr Object Storage |
| CDN | Cloudflare | In front of Vultr Storage |
| Email | Resend | Resend API |
| Payments | Stripe | Stripe API |
| Job Search | RapidAPI jsearch | RapidAPI |
| JD Scraping | Firecrawl | Firecrawl API |

## Key Architectural Decisions

### Modular Monolith

Single Next.js application with clean module boundaries in `lib/*`. Chosen over microservices for: build speed, simpler deployment, easier onboarding for acquirer engineering team. Boundaries are clean enough to extract services post-acquisition if needed.

### Async AI Processing

All AI features (resume builder, fit scorer, optimiser) run via BullMQ job queues, never synchronously in HTTP handlers. This ensures: UI never blocks on AI calls, retries on failure, observable queue health, scale-ready from day one.

### Outcome Tracking

Every AI interaction is logged in `OutcomeEvent` and `AIInteraction`. `UserJourney` aggregates key milestones per user. This generates the outcome data proving AI features work.

## Scale Readiness

Designed to handle 1M+ users with:

- PgBouncer connection pooling (add pre-launch)
- PostgreSQL read replica (add pre-launch)
- Cloudflare CDN for all static assets + object storage
- Redis caching on expensive queries (TTL strategy per query)
- BullMQ workers for all AI processing
- Typesense for search (handles millions of documents)

(Diagram to be added post-Phase 19)
