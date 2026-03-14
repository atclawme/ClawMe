# @ClawMe — Technical Specification

This document describes the technical architecture of the @ClawMe web application (registry + waitlist) and how it is implemented in this repository.

## Overview

@ClawMe is a persistent identity and discovery registry for personal AI agents. It provides:

- Waitlist + handle reservation
- GitHub-authenticated handle claiming
- Public profile pages (`/@handle`)
- A2A resolver endpoint that returns an Agent Card for a handle
- Heartbeat endpoint to keep an agent gateway URL current
- Connection requests between handles

The app runs as a single Next.js application (App Router) that serves both UI pages and `/api/*` routes.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **UI:** Tailwind CSS + shadcn/ui + Framer Motion
- **Auth:** Supabase Auth (GitHub OAuth)
- **Database:** Supabase Postgres
- **Rate limiting:** Upstash Redis (via `@upstash/ratelimit`)
- **Runtime modes:**
  - **Production mode:** Supabase-backed
  - **Mock mode:** In-memory store when Supabase credentials aren’t configured

## Repository Layout

Top-level:

- `frontend/` — Next.js application (UI + API routes)
- `backend/` — backend tests (pytest) used to validate waitlist protection behavior
- `memory/` — product artifacts (PRD and phase specs)

Frontend structure (high level):

- `frontend/src/app/` — App Router pages and route handlers
- `frontend/src/app/api/` — API route handlers
- `frontend/src/components/` — UI components
- `frontend/src/lib/` — shared utilities (auth helpers, supabase clients, mock store, validations, resolver)

## Runtime Modes

### Mock Mode

When Supabase is not configured, the application falls back to an in-memory store.

Key implications:

- Authentication can run in a local/dev mode flow
- Data is stored in-memory and resets on restart
- API routes mirror production semantics as closely as possible

### Production Mode

When Supabase is configured, the app uses:

- Supabase Auth for GitHub OAuth
- Supabase Postgres tables for persistence
- RLS policies to constrain access (implementation details live in Supabase)

## Environment Variables (Production)

The following are required for production deployments:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

For GitHub OAuth:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

## API Surface

All API endpoints are implemented as Next.js route handlers under `frontend/src/app/api`.

### Public

- `POST /api/waitlist`
  - Adds an email (and optional desired handle) to the waitlist.
  - Normalizes `source` to a safe string.

- `GET /api/waitlist/check?handle=...&email=...`
  - Checks handle availability across both `handles` and `waitlist`.
  - Returns:
    - `{ available: false, reason: 'claimed' }` if already claimed
    - `{ available: false, reason: 'waitlist_reserved' }` if reserved for a different email
    - `{ available: true, reserved_for_you: true }` if reserved for the same email
    - `{ available: false, reason: 'reserved' }` for system-reserved handles

- `GET /api/waitlist/count`
  - Returns a waitlist count.

- `GET /api/resolve/[handle]`
  - Returns an A2A Agent Card for the handle.
  - Uses an optional bearer token to determine requester tier (connection visibility).

- `GET /api/health`
  - Returns a health response suitable for uptime monitoring.

### Authenticated

- `POST /api/handle`
  - Claims a handle for the authenticated user.
  - Enforces waitlist reservation protection (a handle reserved by another email cannot be claimed).

- `PUT /api/handle`
  - Updates handle settings.

- `GET /api/handle/me`
  - Fetches the current user’s handle.

- `POST /api/heartbeat`
  - Updates the user’s gateway URL and last heartbeat.

- Connection system
  - `POST /api/connections/request`
  - `GET /api/connections/pending`
  - `PATCH /api/connections/[id]`

## Data Model

Tables (conceptual):

### `waitlist`

- `id` (uuid)
- `email` (text, unique)
- `desired_handle` (text, optional)
- `source` (text)
- `created_at` (timestamptz)

Invariant: a `desired_handle` can be treated as a reservation for the email that requested it.

### `handles`

- `id` (uuid)
- `handle` (text, unique)
- `owner_id` (uuid, FK to `auth.users`)
- `display_name` (text)
- `description` (text)
- `target_gateway` (text)
- `public_key` (text)
- `supported_methods` (text[])
- `visibility_tier` (int: 1|2|3)
- `trust_score` (int)
- `last_heartbeat` (timestamptz)
- `created_at` (timestamptz)

### `connections`

- `id` (uuid)
- `requester_handle_id` (uuid)
- `target_handle_id` (uuid)
- `status` (text: pending|approved|rejected|blocked)
- `requester_message` (text)
- `created_at` (timestamptz)
- `resolved_at` (timestamptz)

## Resolver / Visibility Tiers

The resolver builds an A2A Agent Card whose returned fields depend on requester tier:

- **Tier 1 (Public):** public identity metadata only
- **Tier 2 (Connections):** includes gateway endpoint(s) and public key
- **Tier 3 (Approval required):** includes a connection request URL instead of endpoints

## Phases (1–5)

These phases are the product/engineering roadmap referenced by `README.md`.

- **Phase 1:** Landing page + waitlist
- **Phase 2:** Auth + handle claiming + dashboard + resolver + heartbeat + connections
- **Phase 3:** Client/skill integration for automated heartbeat + discovery tooling
- **Phase 4:** Enhanced identity + trust score + rate limiting hardening
- **Phase 5:** Infrastructure + operational tooling (deployment guides, automation)

## Local Development

From repo root:

```bash
cd frontend
yarn install
yarn start
```

App will run on `http://localhost:3000`.
