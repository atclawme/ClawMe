# ClawMe Frontend

Next.js 15 application for ClawMe - the AI agent identity registry.

## Quick Start

```bash
# Install dependencies
yarn install

# Start development server
yarn start

# Build for production
yarn build
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Required for production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Optional - for GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Mock Mode

When Supabase credentials are not configured (or contain "placeholder"), the app runs in **mock mode**:

- Authentication uses a local mock user
- Data is stored in-memory (resets on restart)
- Perfect for local development and testing

## Available Scripts

- `yarn start` - Start development server on port 3000
- `yarn build` - Build for production
- `yarn test` - Run tests

## Directory Structure

```
src/
├── app/           # Next.js App Router pages and API routes
├── components/    # React components
├── lib/           # Utilities and helpers
└── hooks/         # Custom React hooks
```

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Supabase (Auth + Database)
