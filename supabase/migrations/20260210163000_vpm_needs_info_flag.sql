-- Add a "needs info" project flag to pause SLA/overdue pressure when blocked.
alter table projects
  add column if not exists needs_info boolean not null default false,
  add column if not exists needs_info_note text;

create index if not exists projects_needs_info_idx on projects(needs_info);
