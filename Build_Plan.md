# Build Plan â€” Video Project Management Tool (MVP) + Per Project Chat

## Objective
Ship a usable MVP that centralizes **video project intake â†’ assignment â†’ editing â†’ QC/revisions â†’ delivery**, with **per project chat** so Editors and QC can communicate in context. The MVP must plug cleanly into your existing codebase and stack.

## Target tech stack (must match existing program)
  **Framework:** Next.js **16.1** (App Router) + **TypeScript 5.9** (strict)
  **Runtime:** React **19.2**, Node.js
  **Database:** Supabase (PostgreSQL) with **RLS**, **Edge Functions**, built in **Auth**
  **Auth libs:** `@supabase/ssr 0.8` + `@supabase/supabase js 2.95`
  **Hosting:** Vercel (free tier)
  **Styling:** Tailwind CSS 3.4
  **Charts:** Recharts 3.7 (dashboards)
  **Maps:** react leaflet 5.0 + Leaflet 1.9 + leaflet.heat 0.2 + OpenStreetMap / Nominatim (only if needed by existing app)

   

## Guiding principles
  **Security first:** implement DB schema + Row Level Security (RLS) before UI expands.
  **Single source of truth:** every project has one status, one owner, one due date, and canonical links.
  **Chat is attached to the project:** no separate Slack/Discord threads required for day to day edits.
  **Opinionated workflow:** fewer statuses and strict transitions reduce chaos.
  **Incremental delivery:** ship end to end flow ASAP, then enhance.

   

## Milestones

### Milestone 0 â€” Integration prep (fit into existing codebase)
**Goal:** wire the module into your existing Next.js 16.1 app cleanly.

**Tasks**
  [ ] Identify/confirm existing app patterns:
    [ ] route structure (`app/â€¦`)
    [ ] auth/session handling via `@supabase/ssr`
    [ ] UI component conventions (Tailwind/shadcn)
  [ ] Add a new â€œVideo Projectsâ€ section with top level routes:
    [ ] `/projects` (kanban)
    [ ] `/projects/new` (intake)
    [ ] `/projects/[id]` (detail + chat)
    [ ] `/my queue` (editor queue)
    [ ] `/dashboards/overdue` (ops)
  [ ] Ensure environment variables are aligned across deployments (Vercel):
    [ ] `NEXT_PUBLIC_SUPABASE_URL`
    [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    [ ] `SUPABASE_SERVICE_ROLE_KEY` (server only, optional)
  [ ] Establish deployment: staging branch + preview deployments

**Exit criteria**
  Section is reachable behind auth gates
  Basic layout renders in staging without breaking existing program

   

### Milestone 1 â€” Data model + Security (Supabase schema + RLS)
**Goal:** schema is stable and access control is correct for projects + chat.

**Tasks**
  [x] Create enums:
    [x] `role`: `admin | qc | editor`
    [x] `project_status`: `NEW | ASSIGNED | EDITING | QC | REVISION_REQUESTED | READY | DELIVERED | ARCHIVED | ON_HOLD`
    [x] `priority`: `normal | rush`
  [x] Create tables:
    [x] `profiles` (maps to auth.users)
    [x] `clients`
    [x] `projects`
    [x] `deliverables`
    [x] `revisions`
    [x] `project_messages` (**new**) â€” per project chat
    [x] `activity_log` (recommended)
  [x] Indexes:
    [x] `projects(status)`, `projects(due_at)`, `projects(assigned_editor_id)`
    [x] `project_messages(project_id, created_at)`
  [x] RLS policies:
    [x] Admin/QC: full read/write
    [x] Editor:
      [x] projects: read only where `assigned_editor_id = auth.uid()`
      [x] projects update: only allowed fields (status, preview_url, final_delivery_url, deliverables completion)
      [x] messages: read/write only for projects they are assigned to
  [x] Seed/demo data:
    [x] 1 admin, 1 qc, 2 editors
    [x] 3 clients, 10 projects with deliverables
    [x] a few messages in multiple projects

**Exit criteria**
  Editor cannot query unassigned projects or their messages (verified)
  Editor can post messages on assigned projects only
  QC/Admin can view/post everywhere

   

### Milestone 2 â€” Core workflow UI (Projects end to end)
**Goal:** run the entire pipeline in app.

**Tasks**
  [x] Auth UI (login/logout) + profile fetch + role aware nav
  [x] **Kanban board** by status (filters: editor, priority, due window)
  [x] **Create Project** intake form (required fields enforced)
  [x] **Project Detail** page:
    [x] key fields + links + deliverables
    [x] revision history
    [x] activity log (if enabled)
  [x] **Assignment** actions (QC/Admin)
    [x] assign editor + due date
    [x] status auto updates to `ASSIGNED` if `NEW`
  [x] **Editor My Queue**:
    [x] list/table sorted by due date, priority
    [x] quick actions: open project, set status, paste preview link

**Exit criteria**
  Create â†’ assign â†’ editor sees in My Queue â†’ editor submits to QC

   

### Milestone 3 â€” Per project chat (Editor â†” QC)
**Goal:** allow fast, contextual communication without leaving the project.

**Scope (MVP chat)**
  Text only messages (no attachments) + optional â€œsystem messagesâ€ later
  Shows read only history and real time updates (Supabase Realtime or polling)

**Tasks**
  [x] Add **Chat panel** to Project Detail:
    [x] message list (chronological)
    [x] composer (send)
    [x] basic formatting (plain text + line breaks)
  [x] Real time updates:
    [ ] Preferred: Supabase Realtime subscription on `project_messages`
    [x] Fallback: 5â€“10s polling (simpler, reliable on free tiers)
  [ ] Add â€œjump to latestâ€ and â€œunread since last openâ€ (optional MVP+)
  [x] Logging:
    [x] insert `activity_log` entry for `MESSAGE_SENT` (optional)

**Exit criteria**
  Editor/QC can chat on a project and see updates promptly
  Permissions respected via RLS

   

### Milestone 4 â€” QC + Revisions (structured feedback loop)
**Goal:** eliminate messy revision communication and keep it searchable.

**Tasks**
  [x] QC panel actions:
    [x] Approve (â†’ `READY` or `DELIVERED`)
    [x] Request revision (â†’ `REVISION_REQUESTED`)
      [x] required tags + notes
      [x] create `revisions` row
      [x] increment `revision_count`
  [x] revision history list on Project Detail
  [x] (Optional) post a **system message** into chat when:
    [x] revision requested
    [x] approved/delivered

**Exit criteria**
  Every revision request is logged and status updates correctly
  Chat clearly reflects key lifecycle moments (optional)

   

### Milestone 5 â€” Operational dashboards (Recharts)
**Goal:** immediate visibility into bottlenecks and team load.

**Tasks**
  [x] Overdue view:
    [x] `due_at < now` and status not in `DELIVERED/ARCHIVED`
  [x] Workload view:
    [x] counts by editor and status
  [x] Metrics (basic):
    [x] avg time `ASSIGNED â†’ QC`
    [x] avg revisions per project
  [x] Implement charts in Recharts 3.7

**Exit criteria**
  You can identify late/stuck work and editor load in one click

   

### Milestone 6 â€” Notifications + QoL (optional)
**Tasks**
  [ ] Discord webhook notifications (if still desired)
  [x] â€œNeeds infoâ€ flag to block and pause SLA metrics
  [x] Message mentions (e.g., `@qc`, `@editor`) MVP+
  [ ] Attachments (MVP+): store in Supabase Storage or keep as external URLs

   

## Build order (recommended)
1) Supabase schema + RLS + seed data (including `project_messages`)  
2) Auth + role routing via `@supabase/ssr`  
3) Projects CRUD + Kanban + My Queue  
4) Chat panel + realtime/polling  
5) QC + revisions + activity log  
6) Dashboards + charts  
7) Notifications + polish

   

## Definition of Done (MVP)
  End to end flow: **create â†’ assign â†’ edit â†’ QC â†’ revision loop â†’ delivered**
  Per project chat works and is permissioned correctly
  Overdue dashboard exists
  Seed/demo data exists
  README includes setup + migrations + run instructions
  Staging deployment available on Vercel







