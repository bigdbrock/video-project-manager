-- Seed data for Video Project Manager
-- Replace the placeholder UUIDs below with real auth.users IDs before running.
-- Example: 00000000-0000-0000-0000-000000000001 -> actual UUID from auth.users

-- Required user IDs
-- 00000000-0000-0000-0000-000000000001
-- 00000000-0000-0000-0000-000000000002
-- 00000000-0000-0000-0000-000000000003
-- 00000000-0000-0000-0000-000000000004

insert into profiles (id, full_name, role)
values
  ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'QC User', 'qc'),
  ('00000000-0000-0000-0000-000000000003', 'Editor One', 'editor'),
  ('00000000-0000-0000-0000-000000000004', 'Editor Two', 'editor');

insert into clients (name, email, phone, notes)
values
  ('Acme Realty', 'ops@acmerealty.com', '555-0101', 'Priority real estate client'),
  ('Bluebird Homes', 'hello@bluebirdhomes.com', '555-0112', 'Luxury listings'),
  ('Canyon Estates', 'info@canyonestates.com', '555-0123', 'Weekly pipeline');

insert into projects (
  client_id,
  title,
  address,
  type,
  status,
  priority,
  due_at,
  assigned_editor_id,
  raw_footage_url,
  brand_assets_url,
  music_assets_url,
  preview_url,
  final_delivery_url,
  revision_count,
  created_by
)
values
  ((select id from clients where name = 'Acme Realty' limit 1), 'ACME - 12 Oak St - Main Edit', '12 Oak St', 'Listing Video', 'ASSIGNED', 'normal', now() + interval '3 days', '00000000-0000-0000-0000-000000000003', 'https://drive.google.com/acme/12-oak/raw', 'https://drive.google.com/acme/brand', 'https://drive.google.com/acme/music', null, null, 0, '00000000-0000-0000-0000-000000000001'),
  ((select id from clients where name = 'Acme Realty' limit 1), 'ACME - 77 Lake Rd - Teaser', '77 Lake Rd', 'Teaser', 'EDITING', 'rush', now() + interval '2 days', '00000000-0000-0000-0000-000000000004', 'https://drive.google.com/acme/77-lake/raw', 'https://drive.google.com/acme/brand', 'https://drive.google.com/acme/music', 'https://frame.io/acme/77-lake/preview', null, 1, '00000000-0000-0000-0000-000000000002'),
  ((select id from clients where name = 'Acme Realty' limit 1), 'ACME - 44 Pine Ave - Social Cut', '44 Pine Ave', 'Social Cut', 'QC', 'normal', now() + interval '5 days', '00000000-0000-0000-0000-000000000003', 'https://drive.google.com/acme/44-pine/raw', 'https://drive.google.com/acme/brand', 'https://drive.google.com/acme/music', 'https://frame.io/acme/44-pine/preview', null, 0, '00000000-0000-0000-0000-000000000002'),
  ((select id from clients where name = 'Bluebird Homes' limit 1), 'Bluebird - 9 Sunset Blvd - Main Edit', '9 Sunset Blvd', 'Listing Video', 'ASSIGNED', 'normal', now() + interval '4 days', '00000000-0000-0000-0000-000000000004', 'https://drive.google.com/bluebird/9-sunset/raw', 'https://drive.google.com/bluebird/brand', 'https://drive.google.com/bluebird/music', null, null, 0, '00000000-0000-0000-0000-000000000001'),
  ((select id from clients where name = 'Bluebird Homes' limit 1), 'Bluebird - 301 Grove St - Teaser', '301 Grove St', 'Teaser', 'NEW', 'normal', now() + interval '6 days', null, 'https://drive.google.com/bluebird/301-grove/raw', 'https://drive.google.com/bluebird/brand', 'https://drive.google.com/bluebird/music', null, null, 0, '00000000-0000-0000-0000-000000000001'),
  ((select id from clients where name = 'Bluebird Homes' limit 1), 'Bluebird - 55 Ridge Ln - Social Cut', '55 Ridge Ln', 'Social Cut', 'REVISION_REQUESTED', 'rush', now() + interval '1 days', '00000000-0000-0000-0000-000000000003', 'https://drive.google.com/bluebird/55-ridge/raw', 'https://drive.google.com/bluebird/brand', 'https://drive.google.com/bluebird/music', 'https://frame.io/bluebird/55-ridge/preview', null, 2, '00000000-0000-0000-0000-000000000002'),
  ((select id from clients where name = 'Canyon Estates' limit 1), 'Canyon - 18 Desert Way - Main Edit', '18 Desert Way', 'Listing Video', 'EDITING', 'normal', now() + interval '7 days', '00000000-0000-0000-0000-000000000004', 'https://drive.google.com/canyon/18-desert/raw', 'https://drive.google.com/canyon/brand', 'https://drive.google.com/canyon/music', null, null, 0, '00000000-0000-0000-0000-000000000001'),
  ((select id from clients where name = 'Canyon Estates' limit 1), 'Canyon - 66 Mesa Dr - Teaser', '66 Mesa Dr', 'Teaser', 'QC', 'normal', now() + interval '2 days', '00000000-0000-0000-0000-000000000003', 'https://drive.google.com/canyon/66-mesa/raw', 'https://drive.google.com/canyon/brand', 'https://drive.google.com/canyon/music', 'https://frame.io/canyon/66-mesa/preview', null, 1, '00000000-0000-0000-0000-000000000002'),
  ((select id from clients where name = 'Canyon Estates' limit 1), 'Canyon - 102 Trail Ct - Social Cut', '102 Trail Ct', 'Social Cut', 'READY', 'normal', now() + interval '8 days', '00000000-0000-0000-0000-000000000004', 'https://drive.google.com/canyon/102-trail/raw', 'https://drive.google.com/canyon/brand', 'https://drive.google.com/canyon/music', 'https://frame.io/canyon/102-trail/preview', 'https://frame.io/canyon/102-trail/final', 0, '00000000-0000-0000-0000-000000000002'),
  ((select id from clients where name = 'Canyon Estates' limit 1), 'Canyon - 200 Vista Ln - Main Edit', '200 Vista Ln', 'Listing Video', 'DELIVERED', 'normal', now() - interval '1 days', '00000000-0000-0000-0000-000000000003', 'https://drive.google.com/canyon/200-vista/raw', 'https://drive.google.com/canyon/brand', 'https://drive.google.com/canyon/music', 'https://frame.io/canyon/200-vista/preview', 'https://frame.io/canyon/200-vista/final', 0, '00000000-0000-0000-0000-000000000001');

insert into deliverables (project_id, label, format, specs, completed)
select p.id, d.label, d.format, d.specs, d.completed
from projects p
join (
  values
    ('ACME - 12 Oak St - Main Edit', 'Main Video', 'mp4', '1080p, 30fps', false),
    ('ACME - 12 Oak St - Main Edit', 'Vertical Cut', 'mp4', '1080x1920', false),
    ('ACME - 77 Lake Rd - Teaser', 'Teaser', 'mp4', '30s', true),
    ('ACME - 44 Pine Ave - Social Cut', 'Social Cut', 'mp4', '15s', false),
    ('Bluebird - 9 Sunset Blvd - Main Edit', 'Main Video', 'mp4', '1080p, 30fps', false),
    ('Bluebird - 301 Grove St - Teaser', 'Teaser', 'mp4', '30s', false),
    ('Bluebird - 55 Ridge Ln - Social Cut', 'Social Cut', 'mp4', '15s', false),
    ('Canyon - 18 Desert Way - Main Edit', 'Main Video', 'mp4', '1080p, 30fps', false),
    ('Canyon - 66 Mesa Dr - Teaser', 'Teaser', 'mp4', '30s', false),
    ('Canyon - 102 Trail Ct - Social Cut', 'Social Cut', 'mp4', '15s', true),
    ('Canyon - 200 Vista Ln - Main Edit', 'Main Video', 'mp4', '1080p, 30fps', true)
) as d(title, label, format, specs, completed)
  on p.title = d.title;

insert into revisions (project_id, requested_by, editor_id, reason_tags, notes)
select p.id, '00000000-0000-0000-0000-000000000002', p.assigned_editor_id, array['Color', 'Stabilization'], 'Please soften highlights and stabilize the drone shot.'
from projects p
where p.title = 'Bluebird - 55 Ridge Ln - Social Cut';

insert into project_messages (project_id, sender_id, message, message_type)
select p.id, '00000000-0000-0000-0000-000000000002', 'Please prioritize the kitchen walkthrough segment.', 'user'
from projects p
where p.title = 'ACME - 12 Oak St - Main Edit';

insert into project_messages (project_id, sender_id, message, message_type)
select p.id, '00000000-0000-0000-0000-000000000003', 'Got it. I will update and resubmit by tomorrow.', 'user'
from projects p
where p.title = 'ACME - 12 Oak St - Main Edit';

insert into activity_log (project_id, actor_id, action, meta)
select p.id, '00000000-0000-0000-0000-000000000002', 'REVISION_REQUESTED', jsonb_build_object('notes', 'Please soften highlights and stabilize the drone shot.')
from projects p
where p.title = 'Bluebird - 55 Ridge Ln - Social Cut';

