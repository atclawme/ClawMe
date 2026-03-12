# @ClawMe — GitHub OAuth Activation Guide

Connect GitHub OAuth to enable user authentication.

---

## Step 1: Create a GitHub OAuth App

1. Go to [https://github.com/settings/developers](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name:** @ClawMe
   - **Homepage URL:** `https://clawme-registry.preview.emergentagent.com` (or your production domain)
   - **Authorization callback URL:** `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
     > Find your project ref in Supabase: Settings > General > Reference ID
4. Click **Register application**
5. Note the **Client ID**
6. Click **Generate a new client secret** and note the **Client Secret**

---

## Step 2: Enable GitHub in Supabase Auth Dashboard

1. In your Supabase project, go to **Authentication > Providers**
2. Find **GitHub** and enable it
3. Enter the **Client ID** and **Client Secret** from Step 1
4. Click **Save**

---

## Step 3: Configure Redirect URLs in Supabase

1. In Supabase, go to **Authentication > URL Configuration**
2. Set **Site URL** to: `https://clawme-registry.preview.emergentagent.com`
3. Add to **Additional Redirect URLs**:
   ```
   https://clawme-registry.preview.emergentagent.com/auth/callback
   ```
4. Click **Save**

---

## Step 4: Update Frontend Environment Variables

Add to `/app/frontend/.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your_anon_key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key...
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase-settings
NEXT_PUBLIC_SITE_URL=https://clawme-registry.preview.emergentagent.com
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
CLAWME_JWT_SECRET=a-random-secret-you-generate
```

> The `SUPABASE_JWT_SECRET` is in Supabase: **Settings > API > JWT Settings > JWT Secret**

---

## Step 5: Restart the Frontend

```bash
sudo supervisorctl restart frontend
```

---

## Step 6: Test the Flow

1. Go to `https://clawme-registry.preview.emergentagent.com/login`
2. Click **Continue with GitHub**
3. Authorize the app
4. You should be redirected to `/claim` (first login) or `/dashboard` (returning user)

---

## Notes

- The GitHub OAuth callback URL in GitHub must match exactly: `https://<project-ref>.supabase.co/auth/v1/callback`
- The redirect URL after auth (to your app's `/auth/callback`) is configured in Supabase, not GitHub
- In mock mode (placeholder credentials), the GitHub sign-in button exists but OAuth will not complete
- The `SUPABASE_SERVICE_ROLE_KEY` is server-only and never sent to the browser
- `CLAWME_JWT_SECRET` is used for skill tokens in Phase 3 (OpenClaw)
