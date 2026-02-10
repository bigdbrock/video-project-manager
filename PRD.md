# PRD — Video Project Management Tool (MVP) + Per-Project Chat

## 1) Overview
**Product:** Video Project Management Tool (internal)  
**Primary job-to-be-done:** Keep every video project organized from intake through delivery with clear ownership, due dates, links, revision history, and **project-scoped communication**.

This consolidates project tracking and removes the need for scattered DMs for day-to-day editing feedback.

---

## 2) Tech constraints (must match existing program)
- Next.js **16.1** (App Router) + TypeScript **5.9** strict
- React **19.2**, Node.js
- Supabase Postgres + **RLS**, **Edge Functions**, built-in Auth
- `@supabase/ssr 0.8` + `@supabase/supabase-js 2.95`
- Vercel (free tier)
- Tailwind CSS 3.4
- Recharts 3.7 (dashboards)
- (Existing app) react-leaflet + OSM/Nominatim where applicable

---

## 3) Goals & success metrics

### Goals
- Single source of truth for each project
- Editors only see assigned work (contractor safe)
- Faster turnaround with structured QC/revisions
- **Per-project chat** reduces context switching and missing details

### Success metrics (first 30–60 days)
- 90%+ of projects include: assigned editor, due date, raw link, deliverables list
- Reduce internal status-check messages by 50%+
- Improve on-time delivery rate
- Reduce revision turnaround time (request → resubmission)
- 80%+ of QC/editor communications occur inside project chat (target)

---

## 4) Users & roles

### Admin
- Full access
- Manage users/roles (may be manual in Supabase for MVP)

### QC / Coordinator
- Create projects, assign editors, run QC, request revisions, mark delivered
- Uses chat to coordinate fixes and clarify details

### Editor
- Only sees assigned projects
- Updates preview/final links, deliverables completion, and limited status transitions
- Uses chat to ask questions and respond to QC feedback

---

## 5) Scope

### In scope (MVP)
- Auth + role-based access enforced via RLS
- Clients CRUD (minimal)
- Projects CRUD with status pipeline, due dates, priorities, assignment
- Deliverables checklist per project
- Editor “My Queue”
- QC approval + revision requests with tags + notes
- Revision history log
- Overdue dashboard + basic workload/metrics (Recharts)
- **Per-project chat** (text messages + realtime or polling)
- Activity log (recommended)

### Out of scope (later)
- Client portal
- Video annotation/review (Frame.io-like) inside app
- Payments/invoicing
- Attachments in chat (v1+)
- Advanced analytics/forecasting
- Auto file ingestion from Drive/Dropbox

---

## 6) Status pipeline

### Statuses
- `NEW`
- `ASSIGNED`
- `EDITING`
- `QC`
- `REVISION_REQUESTED`
- `READY`
- `DELIVERED`
- `ARCHIVED`
- `ON_HOLD`

### Transition rules (MVP)
- **QC/Admin:** any transition
- **Editor:**
  - `ASSIGNED → EDITING`
  - `EDITING → QC`
  - `REVISION_REQUESTED → EDITING`
  - `EDITING → QC` (resubmit)

---

## 7) Key user stories

### QC / Coordinator
- As QC, I can create a project with required info so editors don’t ask for basics.
- As QC, I can assign an editor and due date so there is clear ownership.
- As QC, I can request revisions with tags + notes so feedback is structured and searchable.
- As QC, I can chat inside the project to clarify changes without switching tools.
- As QC, I can see overdue projects so I can intervene early.

### Editor
- As an editor, I can see my queue sorted by due date so I know what to do next.
- As an editor, I can access all required links/specs in one place.
- As an editor, I can submit preview/final links and move status forward.
- As an editor, I can ask QC questions in project chat and keep context attached to the job.

---

## 8) Functional requirements & acceptance criteria

### FR1 — Authentication & Access Control (RLS)
**Requirement**
- Users authenticate and have a role (`admin`, `qc`, `editor`)
- DB-level RLS enforces access for projects and chat

**Acceptance criteria**
- Editor cannot access any project not assigned to them (even by URL)
- Editor cannot edit restricted fields (client, due date, assignment)
- Editor cannot view or post messages on unassigned projects

---

### FR2 — Clients
**Requirement**
- Create/edit clients: name, email, phone, notes
- Link projects to a client

**Acceptance criteria**
- Project detail displays linked client details

---

### FR3 — Project creation (Intake)
**Required fields**
- title
- client
- type
- due date
- raw footage URL
- at least 1 deliverable

**Optional fields**
- address
- brand assets URL
- music assets URL
- notes/instructions
- priority (default `normal`)

**Acceptance criteria**
- Intake form blocks submission when required fields missing
- New projects default to status `NEW`

---

### FR4 — Assignment
**Requirement**
- QC/Admin can assign editor and due date
- Assignment moves status to `ASSIGNED` when project is `NEW`

**Acceptance criteria**
- Assigned editor sees the project immediately in “My Queue”

---

### FR5 — Project views
**Requirement**
- Kanban board grouped by status
- Project detail as single source of truth (includes chat panel)

**Acceptance criteria**
- Kanban shows accurate counts and allows filtering
- Project detail contains all key fields, logs, and chat

---

### FR6 — Deliverables checklist
**Requirement**
- Each project has deliverables
- Editor can mark deliverables complete
- QC/Admin can add/remove deliverables

**Acceptance criteria**
- Deliverables completion state is persisted and visible to QC and editor

---

### FR7 — Links (raw/preview/final)
**Requirement**
- `raw_footage_url` required at intake
- Editor can update `preview_url` and `final_delivery_url`

**Acceptance criteria**
- Editor cannot change raw footage URL unless explicitly allowed

---

### FR8 — QC approval & revisions
**Requirement**
- QC/Admin can approve or request revisions
- Revision request requires tags + notes
- Revisions are logged and project revision_count increments

**Acceptance criteria**
- Revision entries show: tags, notes, actor, timestamp
- Status moves to `REVISION_REQUESTED` on revision request

---

### FR9 — Per-project chat (Editor ↔ QC)
**Requirement**
- Each project has a chat thread
- Users can send text messages and view history
- Real-time updates preferred; polling acceptable for MVP

**Acceptance criteria**
- Editor can send messages only on assigned projects
- QC/Admin can send on any project
- Chat shows messages in chronological order with sender name and timestamp
- Chat loads quickly (default: last 50 messages; load older on demand)

---

### FR10 — Activity log (recommended)
**Requirement**
Record key events:
- project created
- assignment
- status changes
- links updated
- revision requested/approved/delivered
- (optional) message sent

**Acceptance criteria**
- Project detail includes a chronological audit trail

---

### FR11 — Dashboards (Recharts)
**Requirement**
- Overdue projects view:
  - `due_at < now` and status not `DELIVERED` or `ARCHIVED`
- Workload view:
  - per-editor counts by status
- Basic metrics:
  - avg time `ASSIGNED → QC`
  - avg revisions per project

**Acceptance criteria**
- Overdue list is accurate and filterable
- Charts render correctly and match underlying data

---

## 9) Non-functional requirements
- **Security:** RLS enabled for all sensitive tables (including chat)
- **Performance:** Kanban loads within 2 seconds for ~500 projects
- **Reliability:** key actions write to activity_log (if enabled)
- **Usability:** project detail must contain everything needed to execute the work
- **Compatibility:** must not conflict with existing app routes and auth patterns

---

## 10) Data model (MVP)

### Core tables
- `profiles(id, full_name, role, created_at)`
- `clients(id, name, email, phone, notes, created_at)`
- `projects(id, client_id, title, address, type, status, priority, due_at, assigned_editor_id, raw_footage_url, brand_assets_url, music_assets_url, preview_url, final_delivery_url, revision_count, created_by, created_at, updated_at)`
- `deliverables(id, project_id, label, format, specs, completed)`
- `revisions(id, project_id, requested_by, editor_id, reason_tags, notes, created_at)`
- `project_messages(id, project_id, sender_id, message, message_type, metadata, created_at)` *(message_type/metadata optional MVP+)*
- `activity_log(id, project_id, actor_id, action, meta, created_at)`

---

## 11) Risks & mitigations
- **RLS misconfiguration leaks client list or chat**
  - Mitigation: test policies using editor accounts; add automated RLS tests
- **Chat realtime complexity**
  - Mitigation: start with polling; add Realtime after stability
- **Inconsistent intake data**
  - Mitigation: enforce required fields and deliverables at intake
- **Status sprawl**
  - Mitigation: fixed statuses and strict transitions

---

## 12) Definition of Done (MVP)
- Full workflow works end-to-end: **create → assign → edit → QC → revision loop → delivered**
- Per-project chat works (history + send) and is permissioned by RLS
- Overdue dashboard exists
- Seed/demo data exists (including chat messages)
- README includes setup + migrations + run instructions
- Staging deployment available on Vercel
