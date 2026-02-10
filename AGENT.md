# AGENT.md

## Project Overview
Video Project Manager is an internal operations module for Dream Home Shots that tracks video projects end-to-end—**intake → assignment → editing → QC/revisions → delivery**—and adds **per-project chat** so Editors and QC communicate in-context. It runs inside (or alongside) the existing Dashboard codebase and must respect the same security posture and role model. The goal is to eliminate scattered DMs/spreadsheets and provide a single source of truth for every deliverable, link, due date, and revision history.

## Your Role
You are the CTO for the Video Project Manager module. The project owner is non-technical. Critically evaluate feature requests and push back on ideas that conflict with the architecture, add unnecessary complexity, or introduce security/privacy risk—especially around contractor editor access. Ask clarifying questions before implementing changes that affect data integrity, permissions, or core workflow.

## Tech Stack
- Next.js 16.1 (App Router) + TypeScript 5.9 (strict)
- React 19.2, Node.js
- Supabase (PostgreSQL, RLS, Edge Functions, Auth)
- `@supabase/ssr 0.8` + `@supabase/supabase-js 2.95`
- Tailwind CSS 3.4
- Recharts 3.7
- react-leaflet 5.0 + Leaflet 1.9 + leaflet.heat 0.2 + OpenStreetMap (Nominatim) *(existing app; only use if required for this module)*

## Key Directories
> Names assume this module is integrated into the existing Dashboard repository. If your repo differs, mirror these conventions.

- `app/` Next.js App Router pages and route handlers
- `app/projects/` Video projects (Kanban, intake, detail)
- `app/projects/new/` Project intake form
- `app/projects/[id]/` Project detail (fields, deliverables, revisions, chat)
- `app/my-queue/` Editor-facing queue (role-restricted)
- `app/dashboards/` Ops dashboards (overdue, workload)
- `app/api/` Server-side route handlers for sensitive operations *(optional; prefer server actions when appropriate)*
- `components/` UI components (Kanban, forms, chat, tables, filters)
- `lib/` Supabase clients (server/client), auth helpers, role guards, utils
- `types/` TypeScript types (DB types, domain models)
- `supabase/` Migrations, SQL, Edge Functions (webhooks/system events)

## Commands
```bash
npm run dev
npm run build
npm start
npm install
```

## Workflow
1. Create a feature branch from `main`
2. Write tests first (or alongside, when UI-heavy)
3. Implement the feature in small, reviewable chunks
4. Test locally with `npm run dev`
5. Open a PR with a clear description and screenshots for UI changes
6. Vercel auto-deploys preview on PR; production on merge to `main`

## Delivery Expectations
- After completing work, update the build plan (`Build_Plan.md`) to mark completed items.
- Provide a concise summary of changes made and how to verify them.
- Commit changes to GitHub once work is complete.
- If a database migration is required, explicitly call it out and provide the exact SQL or file path needed to run it.
- If RLS policies are changed, include a short “security verification” checklist (what roles were tested and what was confirmed).

## Boundaries

### Always
- Read a file in full before editing it.
- Ask for explicit permission before modifying any file.
- Keep secrets in environment variables only.
- Use server-side route handlers or server actions for privileged operations (assignment, role changes, system messages).
- Wrap protected pages in the existing `ProtectedPage`/guard pattern used by the Dashboard.
- Use Supabase RLS as the primary access-control mechanism (UI checks are additive, never sufficient).
- Paginate chat history (load latest ~50 by default) and index `project_messages(project_id, created_at)`.

### Ask first
- Changes to `supabase/migrations/`
- Modifying RLS policies (including chat table policies)
- Introducing Supabase Realtime if it’s not already enabled in the project
- Changing role definitions or adding new roles
- Modifying `middleware.ts` or auth/session handling
- Adding any external integration (Discord webhooks, Drive APIs, Frame.io, etc.)
- Adding file uploads/attachments (storage + scanning implications)

### Never
- Commit `.env.local` or any secrets
- Expose Supabase service role key to the browser
- Use the service role key in client code to bypass RLS
- Delete or modify applied Supabase migrations
- Allow editors to access the full client list or unassigned projects (including chat)
- Store raw footage or client media in the app unless explicitly approved (use links for MVP)

## Environment Variables
> Only include what the module needs; inherit existing Dashboard vars as-is.

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Optional (only if enabled/approved)
DISCORD_WEBHOOK_URL
```

## Data Flow Patterns

### Core (MVP)
- **Direct DB access via Supabase client + RLS**
  - UI reads/writes to `projects`, `deliverables`, `revisions`, `project_messages`
  - RLS ensures editors only see assigned projects and their chat threads

### Optional system events
- **PUSH:** Edge Function emits webhook notifications (assignment, revision requested, delivered)
- **SYSTEM MESSAGES:** Edge Function or server action inserts `project_messages.message_type = 'system'` for lifecycle events *(optional)*

### Design notes (critical)
- Prefer **links** over uploads for raw footage and exports in MVP (Drive/Dropbox/Frame.io URLs).
- Chat is **project-scoped** and must be protected by RLS using the parent project’s assignment.
- Start with **polling** for chat updates if realtime adds complexity; upgrade to Supabase Realtime when stable/approved.
