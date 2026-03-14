

```markdown
# @ClawMe — Phase 3 Build Spec
## ClawMe-Connect Skill for OpenClaw

---

## FRAMING INSTRUCTION — READ FIRST

This is Phase 3 of the @ClawMe project. Phases 1 and 2 are complete and live:
- Phase 1: Landing page + waitlist capture (Next.js, Vercel)
- Phase 2: Registry core — GitHub OAuth, handles table, resolver API, heartbeat,
  connection system, dashboard (Next.js, Supabase, Vercel)

Phase 3 is a SEPARATE repository. It is NOT part of the @ClawMe web app repo.
It is an OpenClaw skill — a small Python package that users install into their
local OpenClaw workspace via ClawHub.

Do not add any files from this spec to the @ClawMe web repo.
Create a new repo: `clawme/clawme-connect`

---

## WHAT THIS PHASE BUILDS

The ClawMe-Connect skill is the client-side bridge that connects a user's local
OpenClaw agent to the live @ClawMe registry. It makes @ClawMe self-maintaining —
the user never manually updates their gateway URL again.

Core responsibilities:
1. Automated heartbeat — keeps the user's gateway URL current in the registry
2. Agent discovery — looks up any @handle and returns their Agent Card
3. Connection requests — sends and manages connection requests via natural language
4. Pending approvals — surfaces incoming connection requests to the user on startup
5. Tunnel safety — warns if the gateway URL is a bare IP or not configured

---

## REPOSITORY STRUCTURE

Create a new GitHub repository: `clawme/clawme-connect`

```
clawme-connect/
  SKILL.md          ← AI persona instructions (read by OpenClaw on install)
  main.py           ← Core skill logic (tools + event handlers)
  README.md         ← User-facing install and setup guide
  requirements.txt  ← Python dependencies
  skill.json        ← ClawHub marketplace metadata
```

No other files are needed. Keep it minimal.

---

## TECH STACK

- **Language:** Python 3.11+
- **Dependencies:** `openclaw-sdk`, `requests`
- **No heavy dependencies** — do not add FastAPI, SQLAlchemy, or any web framework
- **No database** — the skill has no local state beyond what OpenClaw config provides
- **No Supabase credentials** — the skill uses only the user's own `CLAWME_API_TOKEN`

---

## ENVIRONMENT & CONFIGURATION

The skill reads all config from the OpenClaw config and secrets manager.
It never asks the user to edit files manually.

### Config values (set via OpenClaw settings UI)
```
gateway_url       The user's tunnel URL (e.g. wss://abc123.trycloudflare.com)
                  Must start with wss:// or https://
                  Never a bare IP address
```

### Secrets (set via OpenClaw secrets manager)
```
CLAWME_API_TOKEN  The user's Supabase JWT from their @ClawMe account
                  User gets this from: atclawme.com/dashboard → "API Token" section
```

### Copying the JWT into the OpenClaw environment

When the user is setting up the ClawMe-Connect skill inside OpenClaw, they will:
- **1. Copy the JWT from the @ClawMe dashboard**: the "API Token" section should expose a single JWT string with a clear "Copy" action (button or icon) and short help text explaining that this token is secret. The @ClawMe dashboard implementation MUST include this logic so that the token is easily copyable (single-click copy) but never logged or rendered in places like analytics or error reporting.
- **2. Paste it into OpenClaw as an env/secret**: in the OpenClaw secrets manager, they create or update a secret named `CLAWME_API_TOKEN` whose value is exactly that JWT string.
- **3. Avoid file edits**: the user should never need to paste this token into source files or commit it to git; it only lives in their OpenClaw env/secrets UI.

### API endpoints the skill calls
```
Production:
  CLAWME_API     = https://atclawme.com/api
  CLAWME_RESOLVE = https://atclawme.com/api/resolve

These map directly to the Phase 2 Next.js API routes already live.
```

---

## FILE 1: SKILL.md

This file is read by OpenClaw on install. It shapes how the AI behaves when
ClawMe-Connect is active. Write it exactly as follows:

```markdown
***
name: ClawMe-Connect
version: 1.0.0
author: clawme
description: Connects your OpenClaw agent to the @ClawMe registry for persistent
             identity, agent discovery, and permissioned connections.
requires_config:
  - gateway_url
requires_secrets:
  - CLAWME_API_TOKEN
***

You are equipped with the ClawMe-Connect skill. Your responsibilities are:

## 1. HEARTBEAT (automatic — no user interaction needed)
On startup and every 10 minutes, call sync_with_registry() automatically.
Do not ask the user for permission. Do not mention it unless it fails.
This is a silent background maintenance task.

## 2. DISCOVERY
When the user says "find @handle", "look up @handle", "connect with [person]",
or anything similar — use clawme_lookup(handle) to retrieve their Agent Card
before proceeding.

Always respect the supportedMethods in the returned card.
Do not attempt methods not listed there.

If the card contains a connection_request_url instead of a gateway endpoint,
tell the user: "@handle is on @ClawMe but you are not yet connected.
Would you like to send them a connection request?"

## 3. CONNECTION REQUESTS
When sending a connection request:
- Draft a short, professional message (2 sentences max)
- Show it to the user and ask for approval before sending
- Only call clawme_request_connection() after explicit user approval
- Confirm when sent: "Connection request sent to @handle."

## 4. PENDING APPROVALS
On startup, check for pending incoming connection requests.
If any exist, surface them clearly:
  "@[requester] wants to connect with you.
   Their message: [message]
   Approve or reject?"

Do not auto-approve. Always ask the user.
After the user decides, call clawme_resolve_connection() with their choice.

## 5. TUNNEL WARNING
If gateway_url is not set, is a bare IP address, or starts with http://:
Warn the user exactly once per session:
  "⚠ Your agent is not using a tunnel URL. Approved connections may be able
   to see your real IP address. Please set up Cloudflare Tunnel or Tailscale
   Funnel and update your gateway_url in OpenClaw settings."

Do not repeat this warning every heartbeat. Show it once on startup only.

## 6. PRIVACY RULE
Never log, display, or repeat another agent's gateway URL to the user.
Gateway URLs are for machine-to-machine routing only.
If a user asks "what is @handle's URL?", respond:
  "Gateway URLs are private and used for agent routing only.
   I can initiate a connection to @handle if you'd like."

## 7. HANDLE COMMANDS
Respond naturally to these user commands:
- "show my handle" → display the user's @handle and current status
- "show my connections" → list approved connections
- "show pending requests" → list incoming pending requests
- "update my description to [text]" → call clawme_update_handle()
- "set my visibility to [tier]" → call clawme_update_handle()
- "what is my gateway status?" → show current gateway_url and last heartbeat time
```

---

## FILE 2: main.py

Full implementation. Write exactly as follows:

```python
import re
import time
import requests
import openclaw_sdk as sdk

# ── CONFIG ───────────────────────────────────────────────────────────────────
CLAWME_API     = "https://atclawme.com/api"
CLAWME_RESOLVE = "https://atclawme.com/api/resolve"
HEARTBEAT_INTERVAL = 600  # 10 minutes in seconds
_tunnel_warning_shown = False

# ── STARTUP ──────────────────────────────────────────────────────────────────
@sdk.on_event("startup")
def on_startup():
    _check_tunnel_warning()
    sync_with_registry()
    check_pending_connections()
    sdk.schedule(sync_with_registry, interval=HEARTBEAT_INTERVAL)

# ── TUNNEL WARNING (once per session) ────────────────────────────────────────
def _check_tunnel_warning():
    global _tunnel_warning_shown
    if _tunnel_warning_shown:
        return
    gateway = sdk.get_config("gateway_url")
    if not gateway or _is_bare_ip(gateway) or gateway.startswith("http://"):
        sdk.notify(
            "⚠ Your agent is not using a tunnel URL. Approved connections may "
            "be able to see your real IP address. Please set up Cloudflare Tunnel "
            "or Tailscale Funnel and update your gateway_url in OpenClaw settings.\n"
            "Guide: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/"
        )
        _tunnel_warning_shown = True

# ── HEARTBEAT ────────────────────────────────────────────────────────────────
def sync_with_registry():
    gateway = sdk.get_config("gateway_url")
    token   = sdk.get_secret("CLAWME_API_TOKEN")

    if not gateway or not token:
        sdk.log("@ClawMe: gateway_url or CLAWME_API_TOKEN not configured. Skipping heartbeat.")
        return

    if _is_bare_ip(gateway) or gateway.startswith("http://"):
        sdk.log("@ClawMe: gateway_url is not a secure tunnel URL. Heartbeat skipped.")
        return

    try:
        resp = requests.post(
            f"{CLAWME_API}/heartbeat",
            json={"gateway": gateway},
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        if resp.status_code == 200:
            sdk.log("@ClawMe: Heartbeat OK.")
        elif resp.status_code == 401:
            sdk.log("@ClawMe: Heartbeat failed — CLAWME_API_TOKEN is invalid or expired.")
        elif resp.status_code == 404:
            sdk.log("@ClawMe: Heartbeat failed — no handle registered for this token.")
        else:
            sdk.log(f"@ClawMe: Heartbeat failed — status {resp.status_code}.")
    except requests.exceptions.Timeout:
        sdk.log("@ClawMe: Heartbeat timed out. Will retry next interval.")
    except requests.exceptions.ConnectionError:
        sdk.log("@ClawMe: Heartbeat failed — could not reach atclawme.com.")

# ── LOOKUP TOOL ──────────────────────────────────────────────────────────────
@sdk.tool
def clawme_lookup(handle: str) -> dict:
    """
    Finds the A2A Agent Card for a given @handle.
    Returns full card if you are an approved connection.
    Returns partial card + connection_request_url if not connected.
    Returns partial card only (no URL) for anonymous/Tier 1.
    """
    token   = sdk.get_secret("CLAWME_API_TOKEN")
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    handle  = handle.lstrip("@").lower().strip()

    if not re.match(r'^[a-z0-9_]{2,24}$', handle):
        return {"error": "invalid_handle", "message": "Handle format is invalid."}

    try:
        resp = requests.get(
            f"{CLAWME_RESOLVE}/{handle}",
            headers=headers,
            timeout=10
        )
        if resp.status_code == 404:
            return {"error": "not_found", "message": f"@{handle} is not registered on @ClawMe."}
        return resp.json()
    except requests.exceptions.Timeout:
        return {"error": "timeout", "message": "@ClawMe registry did not respond in time."}
    except requests.exceptions.ConnectionError:
        return {"error": "connection_error", "message": "Could not reach atclawme.com."}

# ── CONNECTION REQUEST TOOL ──────────────────────────────────────────────────
@sdk.tool
def clawme_request_connection(handle: str, message: str = "") -> dict:
    """
    Sends a connection request to a @ClawMe @handle.
    Always get user approval before calling this tool.
    """
    token  = sdk.get_secret("CLAWME_API_TOKEN")
    handle = handle.lstrip("@").lower().strip()

    if not token:
        return {"error": "no_token", "message": "CLAWME_API_TOKEN is not configured."}

    try:
        resp = requests.post(
            f"{CLAWME_API}/connections/request",
            json={"target_handle": handle, "message": message},
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        if resp.status_code == 201:
            return {"success": True, "message": f"Connection request sent to @{handle}."}
        elif resp.status_code == 409:
            return {"error": "already_exists", "message": f"A connection with @{handle} already exists or is pending."}
        elif resp.status_code == 404:
            return {"error": "not_found", "message": f"@{handle} is not registered on @ClawMe."}
        else:
            return {"error": "failed", "message": f"Request failed with status {resp.status_code}."}
    except requests.exceptions.Timeout:
        return {"error": "timeout", "message": "Request timed out."}

# ── RESOLVE CONNECTION TOOL ──────────────────────────────────────────────────
@sdk.tool
def clawme_resolve_connection(connection_id: str, action: str) -> dict:
    """
    Approves, rejects, or blocks a pending connection request.
    action must be one of: 'approved', 'rejected', 'blocked'
    Always confirm with the user before calling this.
    """
    token = sdk.get_secret("CLAWME_API_TOKEN")

    if action not in ("approved", "rejected", "blocked"):
        return {"error": "invalid_action", "message": "Action must be approved, rejected, or blocked."}

    if not token:
        return {"error": "no_token", "message": "CLAWME_API_TOKEN is not configured."}

    try:
        resp = requests.patch(
            f"{CLAWME_API}/connections/{connection_id}",
            json={"status": action},
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        if resp.status_code == 200:
            return {"success": True, "message": f"Connection {action}."}
        elif resp.status_code == 403:
            return {"error": "forbidden", "message": "You are not the target of this connection request."}
        else:
            return {"error": "failed", "message": f"Failed with status {resp.status_code}."}
    except requests.exceptions.Timeout:
        return {"error": "timeout", "message": "Request timed out."}

# ── UPDATE HANDLE TOOL ───────────────────────────────────────────────────────
@sdk.tool
def clawme_update_handle(
    description: str = None,
    supported_methods: list = None,
    visibility_tier: int = None
) -> dict:
    """
    Updates the user's @ClawMe handle settings.
    Only provide the fields you want to change — others are left untouched.
    visibility_tier: 1 = public, 2 = connections only, 3 = approval required
    """
    token = sdk.get_secret("CLAWME_API_TOKEN")

    if not token:
        return {"error": "no_token", "message": "CLAWME_API_TOKEN is not configured."}

    payload = {}
    if description      is not None: payload["description"]       = description
    if supported_methods is not None: payload["supported_methods"] = supported_methods
    if visibility_tier  is not None: payload["visibility_tier"]   = visibility_tier

    if not payload:
        return {"error": "empty", "message": "No fields provided to update."}

    try:
        resp = requests.put(
            f"{CLAWME_API}/handle",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        if resp.status_code == 200:
            return {"success": True, "message": "Handle updated successfully."}
        else:
            return {"error": "failed", "message": f"Update failed with status {resp.status_code}."}
    except requests.exceptions.Timeout:
        return {"error": "timeout", "message": "Request timed out."}

# ── PENDING CONNECTIONS (startup check) ──────────────────────────────────────
def check_pending_connections():
    token = sdk.get_secret("CLAWME_API_TOKEN")
    if not token:
        return

    try:
        resp = requests.get(
            f"{CLAWME_API}/connections/pending",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        if resp.status_code != 200:
            return

        pending = resp.json().get("requests", [])
        if not pending:
            return

        count = len(pending)
        sdk.notify(
            f"You have {count} pending @ClawMe connection request{'s' if count > 1 else ''}. "
            f"Say 'show pending requests' to review them."
        )
    except Exception:
        pass  # Silently skip — don't surface startup errors to the user

# ── HELPERS ──────────────────────────────────────────────────────────────────
def _is_bare_ip(url: str) -> bool:
    return bool(re.match(r'https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', url))
```

---

## FILE 3: skill.json

ClawHub marketplace metadata. Fill in exactly:

```json
{
  "name": "clawme-connect",
  "display_name": "ClawMe-Connect",
  "version": "1.0.0",
  "description": "Connects your OpenClaw agent to the @ClawMe registry. Gives your agent a persistent @handle, keeps your gateway URL current automatically, and lets you discover and connect with other agents.",
  "author": "clawme",
  "homepage": "https://atclawme.com",
  "repository": "https://github.com/clawme/clawme-connect",
  "tags": ["identity", "registry", "A2A", "discovery", "connections"],
  "requires_config": ["gateway_url"],
  "requires_secrets": ["CLAWME_API_TOKEN"],
  "min_openclaw_version": "1.0.0",
  "license": "MIT"
}
```

---

## FILE 4: requirements.txt

```
openclaw-sdk
requests
```

That is all. No other dependencies.

---

## FILE 5: README.md

````markdown
# ClawMe-Connect

An OpenClaw skill that connects your agent to the [@ClawMe](https://atclawme.com)
registry — giving it a persistent `@handle` and keeping it discoverable by other agents.

## What it does

- Sends automatic heartbeats to keep your gateway URL current
- Lets you look up any agent by `@handle`
- Sends and manages connection requests via natural language
- Surfaces pending incoming requests on startup
- Warns you if your gateway URL is not a secure tunnel

## Install

```bash
clawhub install clawme/clawme-connect
```

## Setup

1. **Create your @ClawMe account** at [atclawme.com](https://atclawme.com)
2. **Claim your @handle** on the dashboard
3. **Set up a tunnel** — [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
   or [Tailscale Funnel](https://tailscale.com/kb/1223/tailscale-funnel)
4. **Copy your API token** from atclawme.com/dashboard → API Token
5. **In OpenClaw settings:**
   - Set `gateway_url` to your tunnel URL (e.g. `wss://abc123.trycloudflare.com`)
   - Add `CLAWME_API_TOKEN` to your secrets manager

## Usage

Once installed and configured, the skill runs silently. You can also use natural
language commands with your agent:

| Say this | What happens |
|---|---|
| `find @alex` | Looks up @alex's Agent Card |
| `connect with @alex` | Sends a connection request |
| `show pending requests` | Lists incoming connection requests |
| `show my connections` | Lists approved connections |
| `update my description to [text]` | Updates your public profile |
| `set my visibility to private` | Sets visibility tier to 3 |
| `what is my gateway status?` | Shows current gateway + heartbeat time |

## Requirements

- OpenClaw 1.0.0 or later
- A @ClawMe account with a claimed handle
- A tunnel URL (Cloudflare Tunnel or Tailscale Funnel)

## Privacy

Gateway URLs are never shown to users — they are for machine-to-machine routing only.
Your real IP is never exposed to other agents as long as you use a tunnel URL.
````

---

## PUBLISHING TO CLAWHUB

Follow these steps in order after the code is complete:

1. **Create the repo** at `github.com/clawme/clawme-connect` — public, MIT licence
2. **Push all five files:** `SKILL.md`, `main.py`, `skill.json`, `requirements.txt`, `README.md`
3. **Run the security audit locally:**
   ```bash
   openclaw skill audit
   ```
   Fix any warnings before submitting — bare credential checks, unsafe imports, etc.
4. **Submit to ClawHub:**
   ```bash
   openclaw skill publish
   ```
5. **ClawHub review:** automated scan runs first (minutes), then manual review (3–7 business days)
6. **Once approved**, users can install with:
   ```bash
   clawhub install clawme/clawme-connect
   ```

---

## END-TO-END TEST CHECKLIST

Before submitting to ClawHub, verify every item below manually.
Test across at least two network environments (home WiFi + mobile hotspot minimum).

### Heartbeat
- [ ] Heartbeat fires on startup without any user prompt
- [ ] Heartbeat fires again after 10 minutes automatically
- [ ] `last_heartbeat` updates in the @ClawMe dashboard after each heartbeat
- [ ] Heartbeat fails gracefully on network loss — no crash, log message only
- [ ] Heartbeat is skipped (with log) if `CLAWME_API_TOKEN` is missing
- [ ] Heartbeat is skipped (with log) if `gateway_url` is a bare IP

### Tunnel Warning
- [ ] Warning appears on startup if `gateway_url` is empty
- [ ] Warning appears on startup if `gateway_url` is a bare IP
- [ ] Warning appears on startup if `gateway_url` starts with `http://`
- [ ] Warning does NOT repeat on subsequent heartbeats — once per session only
- [ ] No warning if `gateway_url` is a valid `wss://` or `https://` tunnel URL

### Discovery
- [ ] `clawme_lookup("alex")` returns correct Tier 1 partial card for unknown handle
- [ ] `clawme_lookup("alex")` returns full card + gateway for approved connection
- [ ] `clawme_lookup("alex")` returns partial card + `connection_request_url` for Tier 3
- [ ] `clawme_lookup("nonexistent")` returns not_found error gracefully
- [ ] `clawme_lookup("ALEX")` normalises to lowercase correctly

### Connection Requests
- [ ] `clawme_request_connection()` is never called without showing draft message to user first
- [ ] Successful request returns confirmation message
- [ ] Duplicate request returns `already_exists` error gracefully
- [ ] User can approve a pending request via `clawme_resolve_connection(id, "approved")`
- [ ] User can reject a pending request via `clawme_resolve_connection(id, "rejected")`

### Pending Approvals
- [ ] Pending requests are surfaced on startup if any exist
- [ ] No notification shown on startup if zero pending requests
- [ ] Notification count is correct (singular/plural)

### Handle Updates
- [ ] `clawme_update_handle(description="...")` updates the description on the dashboard
- [ ] `clawme_update_handle(visibility_tier=2)` changes tier correctly
- [ ] Calling with no arguments returns `empty` error, not a crash

### Privacy
- [ ] Another agent's `gateway_url` is never surfaced to the user in any response
- [ ] Asking "what is @handle's URL?" returns the privacy message, not the URL

---

## WHAT NOT TO BUILD IN THIS PHASE

- No web UI — this is a pure Python skill
- No local database or file storage
- No Cloudflare Tunnel provisioning (Phase 5)
- No LinkedIn auth integration (Phase 4)
- No custom marketplace outside ClawHub
- No modification to the @ClawMe web repo

---

## PHASE 4 PREVIEW (context only — do not build)

Phase 4 adds LinkedIn OAuth as a second identity provider in the @ClawMe web app,
introduces the trust_score system (increments for verified identity, active heartbeat,
approved connections), and adds rate limiting on the resolver API. A new spec document
will be provided when Phase 4 begins.
```

***

Save this as `ClawMe_Phase3_Skill.md`. The skill itself is two files — `SKILL.md` and `main.py` — everything else is packaging. Ready to move when you are.