# Answerbase

Turn your company knowledge into an AI support chatbot.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Required environment variables

Copy `.env.example` to `.env.local` for local development. Configure the same
variables in Vercel for every environment you intend to deploy:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
OPENAI_API_KEY
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are the
public Supabase client configuration. `SUPABASE_SECRET_KEY` and
`OPENAI_API_KEY` are server-only secrets and must never be exposed to browser
code or prefixed with `NEXT_PUBLIC_`.

## Deploy to Vercel

1. Import this repository into Vercel as a Next.js project.
2. Add all four required environment variables under **Settings → Environment
   Variables**. Apply them to Production and to Preview only if preview
   deployments should use the configured Supabase/OpenAI projects.
3. Deploy the project. Redeploy after changing an environment variable because
   existing deployments keep the values they were built with.
4. Once Vercel assigns the production domain, update Supabase **Authentication
   → URL Configuration**:
   - **Site URL:** `https://<your-production-domain>`
   - **Redirect URL:** `https://<your-production-domain>/auth/callback`

Keep `http://localhost:3000/**` as an additional redirect URL for local
development. If authentication is required on Vercel Preview deployments, add
the preview wildcard recommended by Supabase:
`https://*-<team-or-account-slug>.vercel.app/**`.

Document uploads are capped at 4 MB in the application so Server Action
requests remain below Vercel's 4.5 MB Function payload limit. The private
Supabase Storage bucket may retain its existing 10 MB upper limit.
