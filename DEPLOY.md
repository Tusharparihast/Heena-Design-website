# Deploying Nagma Designs — Frontend on Vercel, Backend on Lovable Cloud

## How it works

- The **backend** (database, sign-in, booking/order logs) stays on Lovable Cloud. Nothing to migrate or manage.
- The **frontend** (this React app) is deployed to Vercel and talks to the backend over its public API — exactly the same way it does in the Lovable preview.

## One-time setup

1. **Push the code to GitHub**: Lovable editor → GitHub → Connect → Create repository.
2. **Import into Vercel**: Vercel dashboard → Add New → Project → Import your repository.
3. **Add environment variables** in Vercel (Project → Settings → Environment Variables), copying the values from this project's `.env` file:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`

   These are publishable (browser-safe) keys. Never add secret keys to Vercel.
4. **Tell me when you're ready** and I'll set the Vercel build target in the Vite config so the deployment compiles correctly.

## Day to day

- Keep building in Lovable as usual — every change synced to GitHub can trigger a Vercel deploy.
- The admin dashboard works identically on Vercel; sign in at `/admin/login`.
- Booking and order logs are stored in the Lovable Cloud database, so they're shared between the Lovable preview and the Vercel site.

## Alternative: one-click hosting on Lovable

If Vercel ever feels like overhead, you can also just press **Publish** in Lovable — the frontend and backend deploy together with zero configuration.
