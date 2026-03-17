
# ClawMe – @handles for self‑hosted AI agents

**A persistent @handle identity + discovery registry for personal AI agents.**

[![Join waitlist](https://img.shields.io/badge/Join%20waitlist-atclawme.com-6C5CE7?style=for-the-badge)](https://atclawme.com/?ref=gh)

![Landing page hero](./docs/landing-hero.png)

ClawMe gives your self‑hosted AI agent a persistent `@handle` and A2A card so other agents can find and talk to it – even when you’re on home Wi‑Fi, spot instances, or tunnels.

Think: *“my agent schedules a meeting with you via your agent”* instead of “send me your IP and hope it hasn’t changed”.

---

## The problem: A2A assumes stable domains

Google’s A2A spec expects agents to publish metadata at:

```text
https://agent.brand.com/.well-known/agent.json
```

That works if you’re a company with a stable domain and proper DNS/TLS.

It breaks for:

- **Home‑hosted agents** – router restarts → new IP → broken URLs.
- **Spot / ephemeral cloud** – every restart gives a new URL.
- **Non‑DNS people** – domains and certs are overkill for a personal agent.

At the same time, we want **agent‑to‑agent delegation** to be normal:

- “My agent can schedule with your agent.”
- “My agent can ask your agent for data.”
- “My agent can route work to your team’s agents.”

You can’t do that reliably if everyone is passing around ad‑hoc URLs.

---

## What ClawMe does

ClawMe is a **registry of `@handles` and A2A cards for self‑hosted agents**:

- You get a unique `@handle` (e.g. `@alex_m`).
- Your agent keeps ClawMe updated with its current **tunnel URL** (not a bare IP).
- Other agents resolve `@alex_m` and get an A2A‑compliant card with the right level of access.[file:1]

Core ideas:

- **Stable identity** on top of dynamic IPs and tunnels.
- **Permissioned tiers** (public card vs approved connections vs request‑only).
- **Privacy‑first** – registry stores tunnel URLs only, never raw IPs.
- **Built for delegation** – safe for “my agent talks to your agent” flows.

---

## How it works (high‑level)

1. **Reserve your @handle**

   Go to [atclawme.com](https://www.atclawme.com), reserve a handle, and sign in with GitHub.

2. **Connect your agent**

   Install the upcoming `@ClawMe` OpenClaw skill. It:

   - reads your agent’s tunnel URL (e.g. Cloudflare Tunnel),
   - sends periodic heartbeats to ClawMe,
   - keeps your A2A card up to date.[file:1]

3. **Agents resolve each other by handle**

   Another agent calls:

   ```text
   GET https://atclawme.com/resolve/@alex_m/agent.json
   ```

   Depending on your settings:

   - **Public:** gets a partial card (name, description, supported methods).
   - **Approved connection:** gets the full card, including live tunnel endpoint.
   - **Unknown but registered:** gets a limited card + a connection‑request URL.[file:1]

   That’s the foundation for flows like “my calendar agent can negotiate with your calendar agent” without either of us exposing an IP.

---

## Example A2A card (Tier 2 – approved connection)

```json
{
  "@context": "https://schema.org/extensions/a2a-v1.json",
  "type": "A2AAgent",
  "id": "clawme:@alex_m",
  "name": "Alex's Home Agent",
  "description": "Self-hosted OpenClaw agent behind a tunnel.",
  "verification": {
    "type": "ClawMeVerifiedHuman",
    "assertionUrl": "https://atclawme.com/v1/verify/alex_m"
  },
  "endpoints": [
    {
      "protocol": "wss",
      "uri": "wss://your-tunnel-url.example",
      "priority": 1,
      "supportedMethods": ["GET_AVAILABILITY", "PROPOSE_MEETING"]
    }
  ],
  "publicKey": {
    "id": "clawme:@alex_m#key-1",
    "type": "Ed25519VerificationKey2020",
    "publicKeyMultibase": "z..."
  }
}
```

---

## Current focus

The product is currently focused on the **waitlist + reservation flow**, ensuring handles are protected and can be auto‑claimed after GitHub sign‑in.[file:1]

Live site: [https://www.atclawme.com](https://www.atclawme.com)

---

## Phases

- **Phase 1:** Landing page + waitlist capture  
- **Phase 2:** Auth + handle claiming + dashboard + resolver + heartbeat + connections  
- **Phase 3:** Agent integration (skill/client) for automated heartbeat + discovery tooling  
- **Phase 4:** Enhanced identity + trust score + rate limiting hardening  
- **Phase 5:** Infrastructure + operational tooling[fIle:1]

---

## Local development

```bash
cd frontend
yarn install
yarn start
```

Visit `http://localhost:3000`. If Supabase isn’t configured, the app runs in **mock mode**.

---

## Docs

- [SPEC](./SPEC.md)
- [PRD](./memory/PRD.md)
- [A2A protocol](https://github.com/google/a2a)
