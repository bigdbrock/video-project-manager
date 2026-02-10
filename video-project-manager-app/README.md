# Video Project Manager (Standalone)

Standalone MVP for tracking video projects end-to-end with per-project chat. Built to integrate into the existing Dashboard later.

## Requirements
- Node.js LTS
- Supabase project (Postgres + Auth)

## Setup
1. Install dependencies
   ```bash
   pnpm install
   ```
2. Create `.env.local` from the template
   ```bash
   copy .env.example .env.local
   ```
3. Start the dev server
   ```bash
   pnpm dev
   ```

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional (server-only later):
- `SUPABASE_SERVICE_ROLE_KEY`

## Project Structure
- `app/` Next.js App Router pages
- `components/` UI components
- `lib/` Supabase client helpers
- `types/` shared TypeScript types

## Integration Plan
See `INTEGRATION_PLAN.md` for the steps to plug this module into the larger program.
