# Architectural Layout — Video Project Management Tool (MVP) + Per-Project Chat

## Stack alignment (must match existing program)
- Next.js **16.1** (App Router) + TypeScript **5.9** strict
- React **19.2**, Node.js
- Supabase Postgres + **RLS**, **Edge Functions**, built-in Auth
- `@supabase/ssr 0.8` + `@supabase/supabase-js 2.95`
- Vercel hosting (free tier)
- Tailwind CSS 3.4
- Recharts 3.7 (dashboards)
- (Optional/Existing app) react-leaflet + OSM/Nominatim

---

## High-level architecture
```
[Browser]
   |
   v
[Next.js 16.1 App (Server + Client)]
   |  (supabase-js, @supabase/ssr)
   v
[Supabase]
  - Auth (JWT sessions)
  - Postgres (RLS policies)
  - Realtime (optional for chat)
  - Edge Functions (optional for notifications/system events)
  - Storage (optional)
   |
   +--> [External file platforms via URL fields]
   |       - Google Drive / Dropbox / Frame.io
   |
   +--> [Webhooks / Notifications (optional)]
           - Discord or other
```

---

## Core modules

### Frontend modules
- **Auth & Role Gate**
  - session via `@supabase/ssr`
  - role-aware routes and nav
- **Projects**
  - kanban board, filters, project detail, status updates
- **Clients**
  - minimal CRUD
- **Deliverables**
  - checklist management + completion
- **QC & Revisions**
  - request revision with tags, approve flows, history
- **Per-project Chat**
  - message history + composer
  - realtime subscription or polling
- **Dashboards**
  - overdue + workload + metrics (Recharts)

### Backend modules (Supabase)
- **Auth**
  - identities, sessions
- **Database**
  - relational tables + indexes
- **RLS (Access Control)**
  - least-privilege for editors (including chat table)
- **Realtime (Chat)**
  - channel/subscription on `project_messages` (optional)
- **Edge Functions (optional)**
  - webhook notifications
  - server-side validations / system messages
- **Storage (optional)**
  - store small attachments if/when needed

---

## Data model (summary)
- `profiles` — user role and name; linked to `auth.users`
- `clients`
- `projects` — the job record (status, due date, assignment, URLs)
- `deliverables`
- `revisions`
- `project_messages` — **per-project chat**
- `activity_log` — audit trail

### `project_messages` (MVP)
- `id` uuid pk
- `project_id` uuid fk
- `sender_id` uuid fk (profile/auth user)
- `message` text
- `created_at` timestamptz
- (Optional) `message_type` enum: `user | system`
- (Optional) `metadata` jsonb (for system events, mentions, etc.)

---

## Key flows

### 1) Create project (intake)
**UI → DB**
- insert `projects`
- insert 1+ `deliverables`
- insert `activity_log`: `PROJECT_CREATED`

### 2) Assign editor
**QC/Admin → DB**
- update `projects.assigned_editor_id`, `projects.due_at`
- update `projects.status` to `ASSIGNED` (if `NEW`)
- insert `activity_log`: `PROJECT_ASSIGNED`
- (Optional) Edge Function triggers webhook + system chat message

### 3) Editor work + submit to QC
**Editor → DB (RLS constrained)**
- update status: `ASSIGNED → EDITING → QC`
- update `preview_url`, optionally `final_delivery_url`
- mark deliverables completed
- insert `activity_log`: `STATUS_CHANGED`, `LINK_UPDATED`, `DELIVERABLE_UPDATED`

### 4) Chat (Editor ↔ QC)
**Editor/QC/Admin → DB**
- insert `project_messages` row
- recipients see updates via:
  - **Realtime**: Postgres changes → subscription
  - or **Polling**: periodic fetch
- (Optional) log `MESSAGE_SENT` in `activity_log`

### 5) QC approve or revision request
**QC/Admin → DB**
- Approve:
  - update status to `READY` or `DELIVERED`
  - insert `activity_log`: `PROJECT_APPROVED` / `PROJECT_DELIVERED`
  - (Optional) insert system chat message
- Revision:
  - insert `revisions` (tags + notes)
  - update status to `REVISION_REQUESTED`
  - increment `revision_count`
  - insert `activity_log`: `REVISION_REQUESTED`
  - (Optional) system chat message + webhook

---

## Status transitions (MVP guardrails)

### Statuses
`NEW, ASSIGNED, EDITING, QC, REVISION_REQUESTED, READY, DELIVERED, ARCHIVED, ON_HOLD`

### Allowed transitions
- **QC/Admin:** any transition (with UI confirmation)
- **Editor:** limited:
  - `ASSIGNED → EDITING`
  - `EDITING → QC`
  - `REVISION_REQUESTED → EDITING`
  - `EDITING → QC`

---

## Security model (RLS)

### Role rules
- `admin`: full access
- `qc`: full access to operational data
- `editor`: least privilege

### Editor access (minimum viable)
- `projects`: read where `assigned_editor_id = auth.uid()`
- `projects` update: allowed fields only:
  - `status` (allowed transitions)
  - `preview_url`, `final_delivery_url`
- `deliverables`: update `completed` where parent project assigned to editor
- `project_messages`: read/write where parent project assigned to editor

**Key point:** UI checks are not sufficient — enforce via RLS.

---

## Performance & scalability notes
- Index `project_messages(project_id, created_at)` for fast chat loads
- Prefer pagination on chat history (load last 50, then older)
- If realtime causes free-tier limits or complexity, use polling initially
- To scale to multi-location later:
  - add `locations` and `projects.location_id`
  - apply RLS by location + role

---

## Operational reliability
- `activity_log` improves debugging and accountability
- Prefer server actions for sensitive updates (assignment, role changes)
- Consider lightweight error monitoring later (e.g., Sentry)
