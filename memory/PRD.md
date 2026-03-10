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
    layout.tsx         — Root layout
    page.tsx           — Landing page
    login/page.tsx     — GitHub OAuth / Dev Mode sign-in
    claim/page.tsx     — Handle claiming flow
    dashboard/         — User dashboard
    [handle]/page.tsx  — Public profile page
    auth/callback/     — OAuth callback with auto-linking
    api/
      waitlist/        — Waitlist CRUD + availability check
      handle/          — Handle management with waitlist protection
      heartbeat/       — Agent heartbeat
      resolve/         — A2A card resolver
      connections/     — Connection requests
  lib/
    supabase.ts        — Client-side Supabase helper
    supabase-server.ts — Server-side Supabase helpers
    auth.ts            — Auth utilities
    mock-store.ts      — In-memory store for development
    validations.ts     — Handle/email validation
    resolver.ts        — A2A card builder
```

---

## User Flows (GitHub Enforced)

### Flow 1: Waitlist → GitHub Sign-In (Reservation Flow)
1. User provides desired handle + email on landing page waitlist
2. Handle is reserved for them in the `waitlist` table
3. Later, user clicks "Sign in with GitHub"
4. Auth callback checks if GitHub email matches waitlist entry
5. **If match:** Auto-claim the reserved handle → redirect to `/dashboard?welcome=true`
6. **If no match:** Redirect to `/claim` for manual selection

### Flow 2: Direct GitHub Sign-In (New User Flow)
1. User skips waitlist and clicks "Sign in with GitHub"
2. Auth callback checks waitlist for their email
3. **If on waitlist with reserved handle:** Auto-claim → dashboard
4. **If not on waitlist:** Redirect to `/claim` to search for available handle

### Handle Availability Rules
| Scenario | `/api/waitlist/check` Response |
|----------|-------------------------------|
| Handle not in waitlist or handles | `{available: true}` |
| Handle claimed (in `handles` table) | `{available: false, reason: "claimed"}` |
| Handle reserved by DIFFERENT email | `{available: false, reason: "waitlist_reserved"}` |
| Handle reserved by SAME email | `{available: true, reserved_for_you: true}` |
| System reserved (admin, api, etc.) | `{available: false, reason: "reserved"}` |

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
- [x] Dev Mode login for local development
- [x] OAuth callback with **auto-linking** from waitlist
- [x] Handle claim flow with **waitlist protection**
- [x] User dashboard with handle card, agent status, connections
- [x] Settings page with all configuration options
- [x] Public profile pages (/@handle)
- [x] Connection request system

### Waitlist Protection (Latest) ✅
- [x] `/api/waitlist/check` accepts optional `email` parameter
- [x] Checks BOTH `waitlist` AND `handles` tables
- [x] Returns `reserved_for_you: true` when email matches reservation
- [x] `/api/handle` validates against waitlist before claiming
- [x] Rejects claims for handles reserved by different emails
- [x] Auth callback auto-claims reserved handles for matching emails
- [x] Claim page passes user email when checking availability
- [x] Clear error messages for reserved vs claimed handles

---

## Database Schema

### waitlist
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| email | text | Unique, not null |
| desired_handle | text | Reserved handle (protected) |
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
| target_gateway | text | Agent gateway URL |
| visibility_tier | int | 1, 2, or 3 |
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

## Test Results (Phase 2 + Waitlist Protection)
- Backend: 100% (15/15 waitlist protection tests passed)
- Frontend: 100% (all pages verified)
- Flows: Both reservation and direct sign-in flows working

---

## Known Limitations
- **MOCKED:** Supabase and GitHub OAuth use placeholder credentials in dev mode
- In-memory store resets on server restart
- Rate limiting: 10 requests/60 seconds per IP (may need adjustment)
