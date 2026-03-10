# ClawMe — Product Requirements Document

## Original Problem Statement
Build ClawMe: a persistent identity and discovery registry for personal AI agents built on Google's A2A protocol.

---

## Architecture

### Stack
- **Frontend/Backend:** Next.js 15 (App Router, TypeScript)
- **Database:** Supabase (Postgres) — using in-memory mock when credentials not configured
- **Authentication:** Supabase Auth with GitHub OAuth (mock mode when not configured)
- **UI:** shadcn/ui, Tailwind CSS, Framer Motion

### Routing
- Port 3000: Next.js frontend + API routes
- All `/api/*` routes handled by Next.js API Routes

### Key Files
```
/app/frontend/src/
  app/
    layout.tsx         — Root layout, Inter + JetBrains Mono fonts
    page.tsx           — Landing page (composes all sections)
    login/page.tsx     — GitHub OAuth / Dev Mode sign-in
    claim/page.tsx     — Handle claiming flow
    dashboard/page.tsx — User dashboard with cards
    dashboard/settings/page.tsx — Full settings page
    [handle]/page.tsx  — Public profile page
    auth/callback/route.ts — OAuth callback handler
    api/
      waitlist/        — Waitlist CRUD
      handle/          — Handle management
      heartbeat/       — Agent heartbeat
      resolve/         — A2A card resolver
      connections/     — Connection requests
  components/
    landing/           — Nav, Hero, HowItWorks, WaitlistForm, Footer
    auth/              — GitHubSignInButton
    dashboard/         — Sidebar, HandleCard, AgentStatusCard, etc.
    profile/           — RequestConnectionModal
  lib/
    supabase.ts        — Client-side Supabase helper with mock mode
    supabase-server.ts — Server-side Supabase helpers
    auth.ts            — Auth utilities with mock user support
    mock-store.ts      — In-memory store for development
    validations.ts     — Handle/email validation
    resolver.ts        — A2A card builder with tiered access
```

---

## Mock Mode

The application runs in **mock mode** when Supabase credentials are not configured (contain "placeholder" or are missing):

| Feature | Mock Mode | Production Mode |
|---------|-----------|-----------------|
| Authentication | "Continue in Dev Mode" button | GitHub OAuth via Supabase |
| Database | In-memory store (resets on restart) | Supabase PostgreSQL |
| User Identity | `mock-user-dev` / `dev@mock.local` | Real GitHub user |
| Session | localStorage (`clawme_mock_session`) | Supabase session cookies |

**To enable production mode:** Update `frontend/.env` with real Supabase credentials (see `supabase_activation.md` and `github_activation.md`).

---

## Design System
- **bg:** #0A0A0F | **surface:** #13131A | **surface-raised:** #1C1C28
- **accent:** #6C47FF | **accent-hover:** #7C5CFF
- **text-primary:** #F0F0F5 | **text-secondary:** #8E8EA0 | **text-muted:** #52525B
- **success:** #22C55E | **error:** #EF4444 | **warning:** #F59E0B
- **Fonts:** Inter (body), JetBrains Mono (handle display)

---

## What's Been Implemented

### Phase 1 — Landing & Waitlist ✅
- [x] Sticky nav with ClawMe wordmark
- [x] Full-viewport hero with animated gradient
- [x] "How It Works" 3-step explainer
- [x] Waitlist form with handle availability check
- [x] Live waitlist counter
- [x] POST /api/waitlist, GET /api/waitlist/check, GET /api/waitlist/count

### Phase 2 — Auth, Handle, Dashboard ✅
- [x] GitHub OAuth sign-in page (/login)
- [x] **Dev Mode login** for local development (no credentials needed)
- [x] OAuth callback handler (/auth/callback)
- [x] Handle claim flow (/claim) with availability validation
- [x] User dashboard (/dashboard) with:
  - Handle card with verified badge
  - Agent status card (gateway URL, last heartbeat, online/offline)
  - Connections card (approved count, pending requests)
  - Visibility tier card
- [x] Settings page (/dashboard/settings) with:
  - Display name and description
  - Supported methods selection
  - Gateway URL and public key
  - Visibility tier selection (1/2/3)
  - Auto-approve verified users option
  - Danger zone (delete handle)
- [x] Public profile pages (/@handle) with:
  - Handle display with verification badge
  - Last seen indicator
  - Request Connection modal
- [x] API Routes:
  - POST/PUT /api/handle — claim and update
  - GET /api/handle/me — current user handle
  - POST /api/heartbeat — agent heartbeat
  - GET /api/resolve/[handle] — A2A card with tiered access
  - POST /api/connections/request — send connection request
  - GET /api/connections/pending — list pending requests
  - PATCH /api/connections/[id] — approve/reject connection

### Cleanup & Documentation ✅
- [x] Removed old Python backend (migrated to Next.js API routes)
- [x] Updated README.md with full documentation
- [x] Created frontend/README.md
- [x] Comprehensive mock mode support

---

## Database Schema

### waitlist
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| email | text | Unique, not null |
| desired_handle | text | Optional |
| source | text | e.g., "landing_page" |
| created_at | timestamptz | Auto-generated |

### handles
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| handle | text | Unique, 2-24 chars |
| owner_id | uuid | FK to auth.users |
| display_name | text | Optional |
| description | text | Max 280 chars |
| target_gateway | text | https:// or wss:// URL |
| public_key | text | Ed25519 multibase |
| supported_methods | text[] | e.g., ['GET_AVAILABILITY'] |
| visibility_tier | int | 1, 2, or 3 |
| auto_approve_rules | jsonb | e.g., {verified_only: true} |
| trust_score | int | Default 0 |
| last_heartbeat | timestamptz | Updated by heartbeat API |
| created_at | timestamptz | Auto-generated |

### connections
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| requester_handle_id | uuid | FK to handles |
| target_handle_id | uuid | FK to handles |
| status | text | pending/approved/rejected/blocked |
| requester_message | text | Optional message |
| created_at | timestamptz | Auto-generated |
| resolved_at | timestamptz | When status changed |

---

## Credentials Required

### Supabase (see /app/supabase_activation.md)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

### GitHub OAuth (see /app/github_activation.md)
- GITHUB_CLIENT_ID
- GITHUB_CLIENT_SECRET

---

## Prioritized Backlog

### P0 — Ready for Production
- [ ] Add real Supabase credentials
- [ ] Add GitHub OAuth credentials
- [ ] Test full auth flow with real credentials
- [ ] Deploy to production

### P1 — Phase 3 (OpenClaw Skill)
- [ ] Python skill package for agent integration
- [ ] Automatic heartbeat registration
- [ ] Connection request tools
- [ ] Skill installation guide

### P2 — Phase 4 (Enhanced Features)
- [ ] LinkedIn OAuth integration
- [ ] Trust score calculation
- [ ] Advanced rate limiting (Redis)
- [ ] Admin moderation tools
- [ ] Handle deletion API

### P3 — Phase 5 (Infrastructure)
- [ ] Cloudflare Tunnel automation
- [ ] Production deployment guide
- [ ] API documentation

---

## Test Results
- Backend: 100% (24/24 tests passed)
- Frontend: 100% (all pages verified)
- Mock mode: Fully functional

---

## Files Cleaned Up
- `/app/backend/` - Removed (migrated to Next.js API routes)
- `/app/tests/` - Removed (empty Python test dir)
