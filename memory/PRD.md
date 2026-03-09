# ClawMe — Product Requirements Document

## Original Problem Statement
Build Phase 1 of ClawMe: a landing page with waitlist capture for a persistent identity registry for personal AI agents built on Google's A2A protocol.

---

## Architecture

### Stack
- **Frontend:** Next.js 15 (App Router, TypeScript), Framer Motion, Tailwind CSS
- **Backend:** FastAPI (Python), running on port 8001
- **Database:** Supabase (Postgres) — waitlist table — PLACEHOLDER, not yet configured
- **Deployment:** Kubernetes (preview.emergentagent.com)

### Routing
- Port 3000: Next.js frontend
- Port 8001: FastAPI backend (all `/api/*` routes via Kubernetes ingress)
- Frontend makes relative `/api/` calls which are routed to FastAPI

### Key Files
```
/app/frontend/src/
  app/
    layout.tsx         — Root layout, Inter + JetBrains Mono fonts
    page.tsx           — Landing page (composes all sections)
    globals.css        — Dark theme CSS vars, hero gradient animation
  components/landing/
    Nav.tsx            — Sticky nav, ClawMe wordmark, Join Waitlist CTA
    Hero.tsx           — Full-viewport hero, animated gradient, Framer Motion
    HowItWorks.tsx     — 3-step explainer cards with scroll animations
    WaitlistForm.tsx   — Handle + email form, availability check, success state
    Footer.tsx         — Simple footer with GitHub link
  lib/
    validations.ts     — HANDLE_REGEX, RESERVED_HANDLES, validateHandle()

/app/backend/
  server.py            — FastAPI with POST /api/waitlist, GET /api/waitlist/check
```

---

## Design System (tokens applied)
- **bg:** #0A0A0F | **surface:** #13131A | **surface-raised:** #1C1C28
- **accent:** #6C47FF | **accent-hover:** #7C5CFF
- **text-primary:** #F0F0F5 | **text-secondary:** #8E8EA0 | **text-muted:** #52525B
- **success:** #22C55E | **error:** #EF4444
- **Fonts:** Inter (body), JetBrains Mono (handle display)

---

## What's Been Implemented (Phase 1 — completed 2026-03-09)

### Frontend
- [x] Next.js 15 App Router with TypeScript
- [x] Sticky nav (60px, backdrop-blur, semi-transparent)
- [x] Full-viewport hero with subtle animated radial gradient
- [x] Framer Motion staggered fade-up animations on page load
- [x] How It Works — 3 cards with whileInView scroll animations
- [x] Waitlist form with:
  - Non-editable `@` prefix in handle input
  - 300ms debounced availability check (GET /api/waitlist/check)
  - Real-time color feedback (green=available, red=taken/invalid)
  - Dynamic submit button label ("Reserve @{handle}" / "Reserve my handle")
  - Inline error messages for email and handle
  - Success state animation (replaces form)
  - Toast notification for generic errors
- [x] Fully responsive from 375px
- [x] No white flash on load (bg #0A0A0F hardcoded in html/body)

### Backend
- [x] POST /api/waitlist — validates email + handle, inserts to Supabase/mock
- [x] GET /api/waitlist/check — validates handle, checks availability
- [x] Handle validation: `^[a-z0-9_]{2,24}$` regex
- [x] Reserved handles rejected: admin, api, resolve, verify, support, clawme, help, root, www
- [x] 409 responses: `{ error: "already_registered" }` and `{ error: "handle_taken" }`
- [x] In-memory rate limiter (10 req/60s per IP) on check endpoint
- [x] In-memory mock store when Supabase not configured

---

## Supabase Setup Required

Add to `/app/backend/.env`:
```
SUPABASE_URL=<your_supabase_project_url>
SUPABASE_ANON_KEY=<your_supabase_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
```

SQL to run in Supabase:
```sql
create table waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  desired_handle text,
  source text,
  created_at timestamptz default now()
);
alter table waitlist enable row level security;
create policy "allow_anon_insert" on waitlist
  for insert to anon with check (true);
```

---

## Prioritized Backlog

### P0 — Phase 1 Remaining
- [ ] Add real Supabase credentials (currently using in-memory mock)

### P1 — Phase 2 Core
- [ ] GitHub OAuth via Supabase Auth
- [ ] Handles table (full registration beyond waitlist)
- [ ] Resolver API (`/resolve/@handle/agent.json`)
- [ ] Heartbeat endpoint
- [ ] Handle uniqueness enforced in DB (unique constraint on desired_handle)

### P2 — Phase 2 Extended
- [ ] Connection request system
- [ ] Dashboard for authenticated users
- [ ] OpenClaw skill integration
- [ ] Admin view for waitlist management

---

## Test Results (Phase 1)
- Backend: 100% (13/13 tests)
- Frontend: 100% (all flows verified)
- Tested: form submission, validation, availability check, duplicate detection, rate limiting, success state, mobile layout
