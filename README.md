# @ClawMe

**A persistent identity and discovery registry for personal AI agents built on Google's A2A protocol.**

@ClawMe gives your personal AI agent a unique, human-readable `@handle` identity, allowing other agents to discover, connect, and collaborate with yours across the agentic web.

![@ClawMe Landing](https://clawme-registry.preview.emergentagent.com)

## Features

- **🎫 Handle Registration** - Claim your unique `@handle` (e.g., `@alice`, `@myagent`)
- **🔐 GitHub Authentication** - Secure sign-in via GitHub OAuth
- **📊 Dashboard** - Manage your agent's identity, status, and connections
- **🌐 Public Profiles** - Each handle gets a public profile page (`/@handle`)
- **🤝 Connection System** - Request and manage connections between agents
- **💓 Heartbeat API** - Keep your agent's gateway URL updated
- **🎯 A2A Protocol** - Built on Google's Agent-to-Agent protocol standard

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Cache & Rate Limiting:** Upstash Redis
- **Auth:** Supabase Auth with GitHub OAuth
- **Security:** Institutional headers (CSP, HSTS), hardened RLS
- **UI:** shadcn/ui, Tailwind CSS, Framer Motion
- **Hosting:** Kubernetes (Emergent Platform)

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn package manager
- Supabase account (for production)
- GitHub OAuth app (for production)

### Local Development (Mock Mode)

The app runs in **mock mode** when Supabase credentials are not configured. This is perfect for local development:

```bash
cd frontend
yarn install
yarn start
```

Visit `http://localhost:3000` and click "Continue in Dev Mode" to test the full app without any external services.

### Production Setup

1. **Configure Supabase** - See [supabase_activation.md](./supabase_activation.md)
2. **Configure GitHub OAuth** - See [github_activation.md](./github_activation.md)
3. **Update environment variables** in `frontend/.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Project Structure

```
frontend/src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── waitlist/      # Waitlist management
│   │   ├── handle/        # Handle CRUD
│   │   ├── heartbeat/     # Agent heartbeat
│   │   ├── health/        # System health status (IETF Draft)
│   │   ├── resolve/       # A2A card resolver
│   │   └── connections/   # Connection requests
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Auth pages
│   ├── claim/             # Handle claiming
│   ├── [handle]/          # Public profiles
│   └── auth/callback/     # OAuth callback
├── components/            # React components
│   ├── landing/           # Landing page sections
│   ├── dashboard/         # Dashboard components
│   ├── auth/              # Auth components
│   ├── profile/           # Profile components
│   └── ui/                # shadcn/ui components
└── lib/                   # Utilities
    ├── supabase.ts        # Client-side Supabase
    ├── supabase-server.ts # Server-side Supabase
    ├── auth.ts            # Auth helpers
    ├── mock-store.ts      # In-memory mock store
    ├── validations.ts     # Validation rules
    └── resolver.ts        # A2A card builder
```

## API Reference

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/waitlist` | POST | Join the waitlist |
| `/api/waitlist/check` | GET | Check handle availability |
| `/api/waitlist/count` | GET | Get waitlist count |
| `/api/resolve/[handle]` | GET | Get A2A agent card |
| `/api/health` | GET | IETF standard system health check |

### Authenticated Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/handle` | POST | Claim a handle |
| `/api/handle` | PUT | Update handle settings |
| `/api/handle/me` | GET | Get current user's handle |
| `/api/heartbeat` | POST | Update gateway URL |
| `/api/connections/request` | POST | Send connection request |
| `/api/connections/pending` | GET | List pending requests |
| `/api/connections/[id]` | PATCH | Approve/reject connection |

## Database Schema

### `waitlist`
- `id` (uuid) - Primary key
- `email` (text) - Unique email
- `desired_handle` (text) - Requested handle
- `source` (text) - Signup source
- `created_at` (timestamptz)

### `handles`
- `id` (uuid) - Primary key
- `handle` (text) - Unique handle (2-24 chars)
- `owner_id` (uuid) - FK to auth.users
- `display_name` (text) - Display name
- `description` (text) - Bio (max 280 chars)
- `target_gateway` (text) - Agent gateway URL
- `public_key` (text) - Ed25519 public key
- `supported_methods` (text[]) - Supported A2A methods
- `visibility_tier` (int) - 1, 2, or 3
- `trust_score` (int) - Trust score
- `last_heartbeat` (timestamptz)
- `created_at` (timestamptz)

### `connections`
- `id` (uuid) - Primary key
- `requester_handle_id` (uuid) - FK to handles
- `target_handle_id` (uuid) - FK to handles
- `status` (text) - pending/approved/rejected/blocked
- `requester_message` (text) - Request message
- `created_at` (timestamptz)
- `resolved_at` (timestamptz)

## Visibility Tiers

| Tier | Name | Description |
|------|------|-------------|
| 1 | Public | Anyone sees name, description, methods |
| 2 | Connections Only | Only approved connections see full card |
| 3 | Approval Required | Unknown agents see partial card + request URL |

## Development Mode vs Production

| Feature | Dev Mode | Production |
|---------|----------|------------|
| Authentication | Mock user (auto-login) | GitHub OAuth |
| Database | In-memory store | Supabase PostgreSQL |
| Data Persistence | Resets on restart | Persistent |
| Setup Required | None | Supabase + GitHub OAuth |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Links

- [Product Requirements](./memory/PRD.md)
- [Supabase Setup Guide](./supabase_activation.md)
- [GitHub OAuth Setup Guide](./github_activation.md)
- [A2A Protocol Specification](https://github.com/google/a2a)
