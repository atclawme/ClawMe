# ClawMe — Supabase Activation Guide

How to switch ClawMe from in-memory mock mode to a live Supabase database.

---

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New project**, choose a name (e.g. `clawme`), pick a region, and set a database password.
3. Wait ~2 minutes for the project to provision.

---

## Step 2: Create the Waitlist Table

In your Supabase project, go to **SQL Editor** and run:

```sql
create table waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  desired_handle text,
  source text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table waitlist enable row level security;

-- Allow anonymous inserts (no reads for anon users)
create policy "allow_anon_insert" on waitlist
  for insert to anon
  with check (true);
```

> The service role key bypasses RLS for reads (used in your count and check endpoints).

---

## Step 3: Get Your Credentials

In your Supabase project, go to **Settings > API**:

| Key | Where to find |
|-----|--------------|
| `SUPABASE_URL` | "Project URL" field |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | "anon public" key |
| `SUPABASE_SERVICE_ROLE_KEY` | "service_role secret" key (keep private) |

---

## Step 4: Update Backend Environment Variables

Open `/app/backend/.env` and replace the placeholder lines:

```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...your_anon_key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key...
```

---

## Step 5: Restart the Backend

```bash
sudo supervisorctl restart backend
```

The backend will automatically detect that `SUPABASE_URL` is no longer a placeholder and switch from in-memory mock to live Supabase.

---

## Step 6: Verify

```bash
# Check the API is responding
curl https://clawme-registry.preview.emergentagent.com/api/waitlist/check?handle=testuser

# Should return: {"available": true}
```

Then try submitting the form on the landing page. Check the **Table Editor** in Supabase to confirm the row was inserted.

---

## Notes

- **In-memory mock** (placeholder credentials): data resets on every backend restart, no persistence.
- **Supabase live**: data is persisted in Postgres, survives restarts.
- The `desired_handle` column has no unique constraint in the above SQL. If you want to enforce uniqueness at the DB level (recommended), add:
  ```sql
  alter table waitlist add constraint waitlist_desired_handle_unique unique (desired_handle);
  ```
- The `SUPABASE_SERVICE_ROLE_KEY` is **never** sent to the browser. It is only used in the FastAPI backend for inserts and counts.

---

## Phase 2 Tables (do not create yet)

The following tables are planned for Phase 2 and should not be created until Phase 2 begins:
- `handles` (full registration beyond waitlist)
- `connections` (agent-to-agent connection requests)
- `heartbeats` (liveness signals from registered agents)
