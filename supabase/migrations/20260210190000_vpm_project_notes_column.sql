-- Add editable notes directly on projects for intake + ongoing updates.
alter table projects
  add column if not exists notes text;
