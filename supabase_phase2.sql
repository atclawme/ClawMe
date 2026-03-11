-- ============================================================
-- ClawMe — Phase 2 Tables
-- Run this in your Supabase SQL Editor when Phase 2 begins.
-- Phase 1 (waitlist) must already exist before running this.
-- ============================================================


-- ------------------------------------------------------------
-- 1. handles
--    One row per registered agent handle.
--    owner_id references auth.users (Supabase Auth).
-- ------------------------------------------------------------
create table handles (
  id                  uuid primary key default gen_random_uuid(),
  handle              text unique not null,
  display_name        text,
  owner_id            uuid not null references auth.users(id) on delete cascade,
  target_gateway      text,
  public_key          text,
  supported_methods   text[],
  description         text,
  visibility_tier     integer not null default 1,
  auto_approve_rules  jsonb,
  trust_score         integer not null default 0,
  last_heartbeat      timestamptz,
  created_at          timestamptz not null default now()
);

-- Enforce one handle per user
create unique index handles_owner_id_unique on handles(owner_id);

-- Fast lookups by handle slug (already covered by unique constraint,
-- but an explicit index makes eq queries faster at scale)
create index handles_handle_idx on handles(handle);

-- Enable Row Level Security
alter table handles enable row level security;

-- Anyone can read handles (needed for the public resolver endpoint)
create policy "handles_public_read" on handles
  for select using (true);

-- Only the owning user can insert their own handle
create policy "handles_owner_insert" on handles
  for insert to authenticated
  with check (owner_id = auth.uid());

-- Only the owning user can update their own handle
create policy "handles_owner_update" on handles
  for update to authenticated
  using (owner_id = auth.uid());


-- ------------------------------------------------------------
-- 2. connections
--    Agent-to-agent connection requests.
--    Both FK columns reference handles.id.
-- ------------------------------------------------------------
create table connections (
  id                  uuid primary key default gen_random_uuid(),
  requester_handle_id uuid not null references handles(id) on delete cascade,
  target_handle_id    uuid not null references handles(id) on delete cascade,
  status              text not null default 'pending'
                        check (status in ('pending', 'approved', 'rejected', 'blocked')),
  requester_message   text,
  created_at          timestamptz not null default now(),
  resolved_at         timestamptz
);

-- Fast lookups used by the pending-requests and resolve endpoints
create index connections_target_status_idx on connections(target_handle_id, status);
create index connections_requester_idx     on connections(requester_handle_id);

-- Enable Row Level Security
alter table connections enable row level security;

-- The requester can see their outgoing requests
create policy "connections_requester_read" on connections
  for select to authenticated
  using (
    requester_handle_id in (
      select id from handles where owner_id = auth.uid()
    )
  );

-- The target can see incoming requests
create policy "connections_target_read" on connections
  for select to authenticated
  using (
    target_handle_id in (
      select id from handles where owner_id = auth.uid()
    )
  );

-- Authenticated users can create connection requests
-- (handle ownership is enforced by the API layer)
create policy "connections_insert" on connections
  for insert to authenticated
  with check (true);

-- Only the target handle's owner can approve/reject/block
create policy "connections_target_update" on connections
  for update to authenticated
  using (
    target_handle_id in (
      select id from handles where owner_id = auth.uid()
    )
  );


-- ------------------------------------------------------------
-- 3. heartbeats  (optional — see note below)
--    The current codebase stores liveness signals directly on
--    the handles row (target_gateway + last_heartbeat columns
--    above).  A separate heartbeats table is only needed if
--    you want a full audit log of every ping.
--    Leave this commented out unless you need the history.
-- ------------------------------------------------------------

create table heartbeats (
  id            uuid primary key default gen_random_uuid(),
  handle_id     uuid not null references handles(id) on delete cascade,
  gateway       text not null,
  recorded_at   timestamptz not null default now()
);

create index heartbeats_handle_idx on heartbeats(handle_id, recorded_at desc);

alter table heartbeats enable row level security;

-- Only the handle owner can read their own heartbeat history
create policy "heartbeats_owner_read" on heartbeats
  for select to authenticated
  using (
    handle_id in (select id from handles where owner_id = auth.uid())
  );

-- Service role inserts (called by the POST /api/heartbeat route)
create policy "heartbeats_service_insert" on heartbeats
  for insert to authenticated
  with check (true);
