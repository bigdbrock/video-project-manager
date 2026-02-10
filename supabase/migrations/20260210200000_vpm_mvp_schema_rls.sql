-- Video Project Manager MVP schema + RLS

create extension if not exists "pgcrypto";

-- Enums
create type role as enum ('admin', 'qc', 'editor');
create type project_status as enum (
  'NEW',
  'ASSIGNED',
  'EDITING',
  'QC',
  'REVISION_REQUESTED',
  'READY',
  'DELIVERED',
  'ARCHIVED',
  'ON_HOLD'
);
create type priority as enum ('normal', 'rush');

-- Tables
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role role not null default 'editor',
  created_at timestamptz not null default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  title text not null,
  address text,
  type text not null,
  status project_status not null default 'NEW',
  priority priority not null default 'normal',
  due_at timestamptz,
  assigned_editor_id uuid references profiles(id) on delete set null,
  raw_footage_url text not null,
  brand_assets_url text,
  music_assets_url text,
  preview_url text,
  final_delivery_url text,
  revision_count integer not null default 0,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  label text not null,
  format text,
  specs text,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table revisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  requested_by uuid references profiles(id) on delete set null,
  editor_id uuid references profiles(id) on delete set null,
  reason_tags text[] not null default '{}'::text[],
  notes text,
  created_at timestamptz not null default now()
);

create table project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  sender_id uuid references profiles(id) on delete set null,
  message text not null,
  message_type text not null default 'user',
  metadata jsonb,
  created_at timestamptz not null default now(),
  constraint project_messages_message_type_check
    check (message_type in ('user', 'system'))
);

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- Indexes
create index projects_status_idx on projects(status);
create index projects_due_at_idx on projects(due_at);
create index projects_assigned_editor_idx on projects(assigned_editor_id);
create index project_messages_project_created_idx on project_messages(project_id, created_at);
create index deliverables_project_idx on deliverables(project_id);
create index revisions_project_idx on revisions(project_id);
create index activity_log_project_created_idx on activity_log(project_id, created_at);

-- Helpers
create or replace function public.current_role()
returns role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin_or_qc()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select role in ('admin', 'qc') from public.profiles where id = auth.uid();
$$;

-- updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger projects_set_updated_at
before update on projects
for each row execute function public.set_updated_at();

-- Editor update guardrails
create or replace function public.enforce_editor_project_update()
returns trigger
language plpgsql
as $$
begin
  if public.current_role() = 'editor' then
    -- prevent edits to protected fields
    if new.client_id is distinct from old.client_id then
      raise exception 'editors cannot change client_id';
    end if;
    if new.title is distinct from old.title then
      raise exception 'editors cannot change title';
    end if;
    if new.address is distinct from old.address then
      raise exception 'editors cannot change address';
    end if;
    if new.type is distinct from old.type then
      raise exception 'editors cannot change type';
    end if;
    if new.priority is distinct from old.priority then
      raise exception 'editors cannot change priority';
    end if;
    if new.due_at is distinct from old.due_at then
      raise exception 'editors cannot change due_at';
    end if;
    if new.assigned_editor_id is distinct from old.assigned_editor_id then
      raise exception 'editors cannot change assigned_editor_id';
    end if;
    if new.raw_footage_url is distinct from old.raw_footage_url then
      raise exception 'editors cannot change raw_footage_url';
    end if;
    if new.brand_assets_url is distinct from old.brand_assets_url then
      raise exception 'editors cannot change brand_assets_url';
    end if;
    if new.music_assets_url is distinct from old.music_assets_url then
      raise exception 'editors cannot change music_assets_url';
    end if;
    if new.revision_count is distinct from old.revision_count then
      raise exception 'editors cannot change revision_count';
    end if;
    if new.created_by is distinct from old.created_by then
      raise exception 'editors cannot change created_by';
    end if;

    -- status transitions for editors
    if new.status is distinct from old.status then
      if not (
        (old.status = 'ASSIGNED' and new.status = 'EDITING') or
        (old.status = 'EDITING' and new.status = 'QC') or
        (old.status = 'REVISION_REQUESTED' and new.status = 'EDITING')
      ) then
        raise exception 'invalid editor status transition from % to %', old.status, new.status;
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger projects_editor_guard
before update on projects
for each row execute function public.enforce_editor_project_update();

create or replace function public.enforce_editor_deliverable_update()
returns trigger
language plpgsql
as $$
begin
  if public.current_role() = 'editor' then
    if new.label is distinct from old.label then
      raise exception 'editors cannot change label';
    end if;
    if new.format is distinct from old.format then
      raise exception 'editors cannot change format';
    end if;
    if new.specs is distinct from old.specs then
      raise exception 'editors cannot change specs';
    end if;
  end if;
  return new;
end;
$$;

create trigger deliverables_editor_guard
before update on deliverables
for each row execute function public.enforce_editor_deliverable_update();

-- RLS
alter table profiles enable row level security;
alter table clients enable row level security;
alter table projects enable row level security;
alter table deliverables enable row level security;
alter table revisions enable row level security;
alter table project_messages enable row level security;
alter table activity_log enable row level security;

-- profiles policies
create policy profiles_select_all on profiles
for select
using (auth.uid() is not null);

create policy profiles_update_self on profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

-- clients policies
create policy clients_select_admin_qc on clients
for select
using (public.is_admin_or_qc());

create policy clients_insert_admin_qc on clients
for insert
with check (public.is_admin_or_qc());

create policy clients_update_admin_qc on clients
for update
using (public.is_admin_or_qc())
with check (public.is_admin_or_qc());

create policy clients_delete_admin_qc on clients
for delete
using (public.is_admin_or_qc());

-- projects policies
create policy projects_select_admin_qc_or_assigned on projects
for select
using (
  public.is_admin_or_qc()
  or assigned_editor_id = auth.uid()
);

create policy projects_insert_admin_qc on projects
for insert
with check (public.is_admin_or_qc());

create policy projects_update_admin_qc_or_assigned on projects
for update
using (
  public.is_admin_or_qc()
  or assigned_editor_id = auth.uid()
)
with check (
  public.is_admin_or_qc()
  or assigned_editor_id = auth.uid()
);

create policy projects_delete_admin_qc on projects
for delete
using (public.is_admin_or_qc());

-- deliverables policies
create policy deliverables_select_admin_qc_or_assigned on deliverables
for select
using (
  public.is_admin_or_qc()
  or exists (
    select 1 from projects p
    where p.id = deliverables.project_id
      and p.assigned_editor_id = auth.uid()
  )
);

create policy deliverables_insert_admin_qc on deliverables
for insert
with check (public.is_admin_or_qc());

create policy deliverables_update_admin_qc_or_assigned on deliverables
for update
using (
  public.is_admin_or_qc()
  or exists (
    select 1 from projects p
    where p.id = deliverables.project_id
      and p.assigned_editor_id = auth.uid()
  )
)
with check (
  public.is_admin_or_qc()
  or exists (
    select 1 from projects p
    where p.id = deliverables.project_id
      and p.assigned_editor_id = auth.uid()
  )
);

create policy deliverables_delete_admin_qc on deliverables
for delete
using (public.is_admin_or_qc());

-- revisions policies
create policy revisions_select_admin_qc_or_assigned on revisions
for select
using (
  public.is_admin_or_qc()
  or exists (
    select 1 from projects p
    where p.id = revisions.project_id
      and p.assigned_editor_id = auth.uid()
  )
);

create policy revisions_insert_admin_qc on revisions
for insert
with check (public.is_admin_or_qc());

create policy revisions_update_admin_qc on revisions
for update
using (public.is_admin_or_qc())
with check (public.is_admin_or_qc());

create policy revisions_delete_admin_qc on revisions
for delete
using (public.is_admin_or_qc());

-- project_messages policies
create policy project_messages_select_admin_qc_or_assigned on project_messages
for select
using (
  public.is_admin_or_qc()
  or exists (
    select 1 from projects p
    where p.id = project_messages.project_id
      and p.assigned_editor_id = auth.uid()
  )
);

create policy project_messages_insert_admin_qc_or_assigned on project_messages
for insert
with check (
  public.is_admin_or_qc()
  or (
    exists (
      select 1 from projects p
      where p.id = project_messages.project_id
        and p.assigned_editor_id = auth.uid()
    )
    and sender_id = auth.uid()
  )
);

create policy project_messages_update_admin_qc on project_messages
for update
using (public.is_admin_or_qc())
with check (public.is_admin_or_qc());

create policy project_messages_delete_admin_qc on project_messages
for delete
using (public.is_admin_or_qc());

-- activity_log policies
create policy activity_log_select_admin_qc_or_assigned on activity_log
for select
using (
  public.is_admin_or_qc()
  or exists (
    select 1 from projects p
    where p.id = activity_log.project_id
      and p.assigned_editor_id = auth.uid()
  )
);

create policy activity_log_insert_admin_qc_or_assigned on activity_log
for insert
with check (
  public.is_admin_or_qc()
  or exists (
    select 1 from projects p
    where p.id = activity_log.project_id
      and p.assigned_editor_id = auth.uid()
  )
);

create policy activity_log_update_admin_qc on activity_log
for update
using (public.is_admin_or_qc())
with check (public.is_admin_or_qc());

create policy activity_log_delete_admin_qc on activity_log
for delete
using (public.is_admin_or_qc());
