# Environment Configuration

This project uses Supabase + Netlify Functions with an AI routing layer. Copy `.env.example` to `.env.local` (or your platform’s secret store) and fill the values below.

## Required (Supabase)
- `VITE_SUPABASE_URL` – Supabase project URL.
- `VITE_SUPABASE_ANON_KEY` – Public anon key for the client.
- `SUPABASE_SERVICE_ROLE_KEY` – Service role key for server-side functions (required for AI telemetry and admin endpoints).
- `SUPABASE_URL` – Server-side URL (defaults to `VITE_SUPABASE_URL`).

## AI Routing / Providers
- `AIMLAPI_API_KEY` – Primary, low-cost provider.
- `OPENAI_API_KEY` – Premium fallback.
- `ANTHROPIC_API_KEY` – Premium fallback.
- `DEEPSEEK_API_KEY` – Economy fallback.
- `GOOGLE_API_KEY` – Optional Gemini support.
- `BRAVE_API_KEY`, `TAVILY_API_KEY` – Search providers for sourcing links.
- `AI_MAX_ATTEMPTS` – Retry attempts per routed call (default 3).
- `AI_CAP_FREE_DAILY`, `AI_CAP_PRO_DAILY`, `AI_CAP_PREMIUM_DAILY` – Daily request caps per tier (used by telemetry).
- `AI_CAP_FREE_HIGH_DAILY`, `AI_CAP_PRO_HIGH_DAILY`, `AI_CAP_PREMIUM_HIGH_DAILY`, `AI_CAP_COACH_HIGH_DAILY` – High-quality request caps per tier.

## Access Control / Ops
- `ADMIN_SECRET` – Header secret for existing admin functions.
- `FOUNDER_EMAILS` – Comma-separated allowlist for the founder-only AI ops endpoint.

## Job Ingestion Providers
- `FINDWORK_API_KEY`, `JOOBLE_API_KEY`, `THEMUSE_API_KEY`, `REED_API_KEY`
- `USAJOBS_API_KEY`, `USAJOBS_USER_AGENT`
- `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`
- `CAREERONESTOP_USER_ID` – CareerOneStop registered User ID
- `CAREERONESTOP_API_KEY` – CareerOneStop API token (Bearer auth)
- `ENABLE_SOURCE_CAREERONESTOP` – Enable/disable CareerOneStop ingestion (default: true)
- `CAREERONESTOP_MAX_PAGES_PER_RUN` – Max pages per run (default: 3)
- `THEIRSTACK_API_KEY` – TheirStack aggregator API key
- `ENABLE_SOURCE_THEIRSTACK` – Enable/disable TheirStack ingestion (default: true)
- `THEIRSTACK_MAX_RESULTS_PER_RUN` – Max jobs per run (default: 300)
- `ENABLE_SOURCE_LEVER` – Enable/disable Lever job board ingestion (default: false)
- `LEVER_SOURCES_JSON` – JSON array of Lever company configs: `[{"companyName": "Company Name", "leverSlug": "company-slug"}, ...]`
  - Each entry can have: `companyName` (required), `leverSlug` or `leverApiUrl` (at least one required)
  - Example: `[{"companyName": "Acme Corp", "leverSlug": "acme"}, {"companyName": "TechCo", "leverApiUrl": "https://api.lever.co/v0/postings/techco"}]`
- `LEVER_MAX_COMPANIES_PER_RUN` – Maximum companies to fetch per ingestion run (default: 20)

## Payments / Analytics
- `REACT_APP_STRIPE_PUBLIC_KEY`
- `REACT_APP_ANALYTICS_ENABLED`

## Optional
- `VITE_API_URL` – Override the frontend AI endpoint (defaults to the Netlify function path).
- `JWT_SECRET` – Test token signing for local AI endpoint tests.

> Keep real keys out of source control. Use your hosting secret manager for deploys.***
