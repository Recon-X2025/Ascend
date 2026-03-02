# Phase 9: Career Graph & Contextual Networking — Build Summary

## Overview

Phase 9 implements Ascend’s **career trajectory graph**: connections, company follows, context-anchored messaging, and a **career signal feed** (no user-generated posts). The network is built around career outcomes, not social reach.

## Delivered

### 1. Prisma (migration `phase-9-career-graph`)

- **Enums:** `ConnectionType` (PEER, MENTOR, COLLEAGUE, INTERVIEWER), `ConnectionStatus` (PENDING, ACCEPTED, DECLINED, WITHDRAWN), `SignalType` (ROLE_MOVE, NEW_JOB_AT_FOLLOW, NETWORK_JOIN, FIT_SCORE_IMPROVE, CONNECTION_HIRED, MENTOR_AVAILABLE).
- **Models:** `Connection`, `CompanyFollow`, `Conversation`, `Message`, `CareerSignal`.
- **Message context:** `jobPostId`, `companyId`, `sessionId` (nullable; session for Phase 9B).
- **Relations:** User (connectionsInitiated/Received, companyFollows, conversations, messages, signalFeed, signalsActed); Company (followers, messageContexts, signals); JobPost (messageContexts, signals).

### 2. Connection APIs

- `POST /api/connections/request` — Send request (recipientId, type, contextTag); creates notification.
- `PATCH /api/connections/[id]/respond` — accept | decline | withdraw; on accept, emits NETWORK_JOIN to both networks.
- `GET /api/connections` — List with status/type filters, pagination, profile snippets.
- `GET /api/connections/suggestions` — Up to 10 suggestions (second-degree, companies followed, same intent, alumni).
- `GET /api/connections/status/[userId]` — Status with current user for profile CTA.

### 3. Company follow

- `GET /api/companies/[slug]/follow` — { following, followerCount }.
- `POST /api/companies/[slug]/follow` — Toggle follow.
- `GET /api/companies/following` — List companies the current user follows.

### 4. Messaging

- `POST /api/messages/conversations` — Start conversation or send first message; **recruiter cold outreach requires `jobPostId`** (returns 400 RECRUITER_MUST_ATTACH_JOB otherwise).
- `GET /api/messages/conversations` — List with last message and unread count.
- `GET /api/messages/conversations/[id]` — Messages (paginated), marks as read.
- `POST /api/messages/conversations/[id]/messages` — Send message (body, optional jobPostId/companyId).
- `PATCH /api/messages/conversations/[id]/read` — Mark read.

### 5. Career signal feed

- `GET /api/feed` — Paginated signals (default unseen only; `?includeSeen=true` for all).
- `PATCH /api/feed/[id]/seen` — Mark one seen.
- `POST /api/feed/mark-all-seen` — Mark all seen.

### 6. Signal emission (`lib/signals/emit.ts`)

- `emitSignal({ type, actorId?, audienceUserIds, companyId?, jobPostId?, metadata? })`.
- **Wired:**
  - Job post → ACTIVE (create or PATCH): `NEW_JOB_AT_FOLLOW` to company followers.
  - Connection accepted: `NETWORK_JOIN` to requester’s and recipient’s networks.
  - Profile PATCH (currentRole/currentCompany change): `ROLE_MOVE` to connections.

### 7. Circles (derived)

- `GET /api/network/circles` — `yourNetwork`, `yourIndustry`, `atThisCompany` (computed from connections, career intent, work history).

### 8. Nav badges

- `GET /api/network/counts` — `pendingConnections`, `unreadMessages`, `unseenSignals`.

### 9. UI

- **/network** — Tabs: My Network (pending, connections, suggestions), Circles (Your Network / Your Industry / At This Company), Following (companies with unfollow).
- **/messages** — Conversation list + thread; new message (recipient ID + body); recruiter job attachment enforced server-side.
- **/feed** — Career updates list; mark all seen; SignalCard per type (ROLE_MOVE, NEW_JOB_AT_FOLLOW, NETWORK_JOIN, etc.).
- **Profile** — ConnectionRequestButton (Connect | Pending | Message) for non-owners.
- **Nav** — Network, Messages, Career updates with badge counts (NavBadges).
- **Seeker dashboard** — NetworkCard (pending + suggestions), FeedPreview (latest 3 signals).

### 10. Notifications

- `notifyConnectionRequest`, `notifyMessageReceived` in `lib/notifications/create.ts` (CONNECTION_REQUEST, MESSAGE_RECEIVED).

## Key files

| Area | Paths |
|------|--------|
| Schema | `prisma/schema.prisma` (Phase 9 enums/models) |
| Signals | `lib/signals/emit.ts` |
| Connections | `app/api/connections/request`, `[id]/respond`, `route`, `suggestions`, `status/[userId]` |
| Follow | `app/api/companies/[slug]/follow`, `app/api/companies/following` |
| Messages | `app/api/messages/conversations`, `conversations/[id]`, `[id]/messages`, `[id]/read` |
| Feed | `app/api/feed`, `feed/[id]/seen`, `feed/mark-all-seen` |
| Network | `app/api/network/circles`, `api/network/counts` |
| UI | `app/network`, `app/messages`, `app/feed`, `components/network/*`, `components/feed/*`, `components/messages/*`, `components/layout/NavBadges.tsx` |

## Constraints respected

- Connection has `type: ConnectionType` from day one (Phase 9B can use MENTOR).
- Message has `jobPostId`, `companyId`, `sessionId` (sessionId null in Phase 9).
- Recruiter cold outreach requires `jobPostId`; enforced in `POST /api/messages/conversations`.
- No open inbox: message only between connections or with recruiter + job.
- No content feed: CareerSignal events only; no posts/reactions/comments.
- Circles derived from data (no Circle model).
- Ascend language: “Your Network”, “Career updates”, “People who can help you get there”; no follower counts for people, no “feed”/“timeline”/“post”.

## Exit checklist

- [x] Migration `phase-9-career-graph` applied.
- [x] ConnectionType (PEER, MENTOR, COLLEAGUE, INTERVIEWER) and Message context fields in place.
- [x] Connection request / respond / list / suggestions / status working.
- [x] Company follow toggle and following list working.
- [x] Messaging with recruiter job attachment rule (RECRUITER_MUST_ATTACH_JOB).
- [x] NEW_JOB_AT_FOLLOW, ROLE_MOVE, NETWORK_JOIN emitted as specified.
- [x] Circles API and /network tabs (My Network, Circles, Following).
- [x] /messages and /feed pages; profile Connect/Pending/Message CTA; nav badges; seeker NetworkCard and FeedPreview.
