# Base44 Dev Environment

## Project Overview
- **WP Manager** — Persian/RTL digital agency project management system
- Frontend: React 19 + TypeScript + Vite 8 + MUI 7 + React Router 7 + React Query 5 + Zustand 5
- Backend: Supabase (auth, database, edge functions)

## Running the App
```bash
docker compose -f docker-compose.base44.yml up -d
```
- Web entry point: http://localhost:3000 (maps to Vite dev server on 5173)
- Healthcheck: `GET /` returning 200
- Live reload is active (Vite HMR); edits appear without rebuilds

## Required Environment Variables
- `VITE_SUPABASE_URL` — Supabase project URL (from Supabase dashboard > Project Settings > API)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key (same location)

Without real credentials, the app boots and renders the login page, but auth and database calls will fail. Provide real values via the Base44 secrets dashboard.

## Architecture Notes
- The app is frontend-only (Vite SPA); all backend logic is in Supabase (PostgreSQL + Auth + Edge Functions)
- `supabase/migrations/` contains the database schema and seed data
- `supabase/functions/create-agency/` is a Deno edge function called during sign-up
- Auth flow: `AuthContext` wraps the app; unauthenticated users see `/auth`, authenticated users see the dashboard layout
- The app is RTL (right-to-left) Persian; `stylis-plugin-rtl` handles CSS direction
- `src/lib/supabase.ts` exports the Supabase client and TypeScript types for all database entities

## Dev Environment Details
- Node 22-slim base image with bind-mounted source
- Dependencies installed via `npm ci` on container startup (node_modules in a named volume)
- `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` is passed through for Vite host allowlisting
- `.env.base44-defaults` provides placeholder values so the app boots without credentials; `/run/base44/app.env` (platform secrets) overrides them
