# Integration Plan: Video Project Manager -> Dashboard

This module is built as a standalone Next.js app. The steps below outline how to merge it into the existing Dashboard codebase.

## 1) Repo merge strategy
- Create a feature branch in the Dashboard repo.
- Copy `app/(app)` routes and `components/`, `lib/`, `types/` into the Dashboard structure.
- Resolve route collisions by nesting under `app/projects` and `app/my-queue` as documented in the build plan.

## 2) Auth alignment
- Replace `lib/supabase/client.ts` and `lib/supabase/server.ts` with the Dashboard equivalents.
- Use the existing `ProtectedPage` or guard pattern to wrap project routes.
- Confirm role data comes from the same `profiles` table.

## 3) Styling alignment
- Keep the visual language but adapt to the Dashboard global styles.
- Move shared tokens to the Dashboard theme or Tailwind config.

## 4) Supabase schema
- Apply the migration from `C:\Users\Darren\Desktop\video project manager\supabase\migrations\20260210200000_vpm_mvp_schema_rls.sql` in the Dashboard Supabase project.
- Use `supabase/seed.sql` only in non-production environments.

## 5) Data wiring
- Replace mock data on the Kanban, queue, and detail pages with Supabase queries.
- Add server actions or route handlers for privileged operations (assignments, status changes, system messages).

## 6) RLS verification
- Validate editor restrictions across projects, messages, and deliverables.
- Run regression checks for admin and QC roles.

## 7) QA checklist
- Verify auth gating for all new routes.
- Validate status transitions for editors.
- Confirm chat pagination and indexing on `project_messages(project_id, created_at)`.

## 8) Deployment
- Add any new environment variables to Vercel.
- Deploy a preview for stakeholder review.
