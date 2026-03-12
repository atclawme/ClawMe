# 🛡️ Security Hardening & Production Readiness Checklist

This document tracks the security status and production readiness of the **@ClawMe** platform. 

## 1. 🚨 Critical Vulnerability Status

### Database Security (Supabase RLS)
- [x] **Fix Handles Data Leak**: Restrict `handles_public_read` policy to only basic columns. (Prevents scraping private `target_gateway` URLs).
- [x] **Protect Waitlist Referrals**: Restrict `waitlist_referrals` authenticated read policy. (Prevents GitHub users from reading all PII/Emails).
- [x] **Harden Connection Table**: Ensure `connections_insert` has a check `with check (requester_handle_id in (select id from handles where owner_id = auth.uid()))`.
- [x] **Harden Waitlist Table**: Restrict waitlist table reads to owner-only.

### secrets & Auth
- [ ] **Secret Rotation Plan**: Establish a process for rotating `SUPABASE_SERVICE_ROLE_KEY` and `GITHUB_CLIENT_SECRET`.
- [ ] **Auth Callback Validation**: Add strict `origin` validation and state checking in `/auth/callback`.

---

## 2. ⚙️ Production Readiness Checklist

### Build & Environment
- [x] **Strict Builds**: Disable `ignoreBuildErrors` and `ignoreDuringBuilds` in `next.config.js`.
- [ ] **Dependency Audit**: Run `yarn audit` and fix the low-severity vulnerability in `eslint`.
- [ ] **Env Sync**: Verify all keys in `.env.local` are mirrored in Vercel/Production dashboard.

### Infrastructure & Performance
- [x] **Distributed Rate Limiting**: Replace Map-based rate limiter with Redis-backed solution.
- [x] **Security Headers**: Add CSP, HSTS, and X-Frame-Options to `next.config.js`.
- [x] **Health Monitoring**: Add `/api/health` or `/api/status` for platform health checks.

### Code Quality & Validation
- [x] **Input Validation**: Implement `zod` schema validation for all API POST/PUT requests.
- [ ] **Logging**: Implement structured logging (e.g., `pino`) – remove all raw `console.log`.
- [ ] **Error Handling**: Standardize API error responses across all routes.

---

## 3. 📝 Progress Log

| Date | Item | Status | Notes |
| :--- | :--- | :--- | :--- |
| 2026-03-11 | Initial Assessment | ✅ Done | Identified RLS leaks and build flag issues. |
| 2026-03-11 | Supabase RLS Hardening | ✅ Done | Applied secure policies to connections, waitlist, and referrals. |
| 2026-03-11 | Strict Build Config | ✅ Done | Enabled ESLint/TS build enforcement in next.config.js. |
| 2026-03-11 | Distributed Rate Limiting | ✅ Done | Integrated Upstash Redis into API routes. |
| 2026-03-11 | Security Headers | ✅ Done | Added CSP, HSTS, and clickjacking protection to next.config.js. |
| 2026-03-11 | Health Monitoring | ✅ Done | Created /api/health for system status checks. |
| 2026-03-11 | Input Validation | ✅ Done | Integrated Zod schemas across all mutation API routes. |
| | | | |

---

## 🔍 Detailed Assessment Summary

### RLS Permissiveness
The current RLS logic on `handles` and `waitlist_referrals` is the highest priority. Direct PostgREST access via the `anon` key currently allows over-exposure of internal field data that the API resolver is designed to filter.

### Serverless Compatibility (Resolved)
The previously problematic in-memory `Map` rate-limiter has been replaced with **Upstash Redis**. This ensures that rate limits are shared across all serverless function instances on Vercel and persist across cold starts.

### Build Integrity
Ignoring TypeScript/ESLint errors is acceptable for rapid prototyping but dangerous for production deployment. It hides memory leaks, type safety regressions, and potential runtime crashes.
