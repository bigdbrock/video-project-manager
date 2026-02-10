-- Allow project creator to view/update their project (even if role=editor)

-- Update policies to include created_by
DROP POLICY IF EXISTS projects_select_admin_qc_or_assigned ON projects;
CREATE POLICY projects_select_admin_qc_or_assigned ON projects
FOR SELECT
USING (
  public.is_admin_or_qc()
  OR assigned_editor_id = auth.uid()
  OR created_by = auth.uid()
);

DROP POLICY IF EXISTS projects_update_admin_qc_or_assigned ON projects;
CREATE POLICY projects_update_admin_qc_or_assigned ON projects
FOR UPDATE
USING (
  public.is_admin_or_qc()
  OR assigned_editor_id = auth.uid()
  OR created_by = auth.uid()
)
WITH CHECK (
  public.is_admin_or_qc()
  OR assigned_editor_id = auth.uid()
  OR created_by = auth.uid()
);

-- Allow creator editors to bypass restricted field checks
CREATE OR REPLACE FUNCTION public.enforce_editor_project_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF public.current_role() = 'editor' AND OLD.created_by IS DISTINCT FROM auth.uid() THEN
    -- prevent edits to protected fields
    IF NEW.client_id IS DISTINCT FROM OLD.client_id THEN
      RAISE EXCEPTION 'editors cannot change client_id';
    END IF;
    IF NEW.title IS DISTINCT FROM OLD.title THEN
      RAISE EXCEPTION 'editors cannot change title';
    END IF;
    IF NEW.address IS DISTINCT FROM OLD.address THEN
      RAISE EXCEPTION 'editors cannot change address';
    END IF;
    IF NEW.type IS DISTINCT FROM OLD.type THEN
      RAISE EXCEPTION 'editors cannot change type';
    END IF;
    IF NEW.priority IS DISTINCT FROM OLD.priority THEN
      RAISE EXCEPTION 'editors cannot change priority';
    END IF;
    IF NEW.due_at IS DISTINCT FROM OLD.due_at THEN
      RAISE EXCEPTION 'editors cannot change due_at';
    END IF;
    IF NEW.assigned_editor_id IS DISTINCT FROM OLD.assigned_editor_id THEN
      RAISE EXCEPTION 'editors cannot change assigned_editor_id';
    END IF;
    IF NEW.raw_footage_url IS DISTINCT FROM OLD.raw_footage_url THEN
      RAISE EXCEPTION 'editors cannot change raw_footage_url';
    END IF;
    IF NEW.brand_assets_url IS DISTINCT FROM OLD.brand_assets_url THEN
      RAISE EXCEPTION 'editors cannot change brand_assets_url';
    END IF;
    IF NEW.music_assets_url IS DISTINCT FROM OLD.music_assets_url THEN
      RAISE EXCEPTION 'editors cannot change music_assets_url';
    END IF;
    IF NEW.revision_count IS DISTINCT FROM OLD.revision_count THEN
      RAISE EXCEPTION 'editors cannot change revision_count';
    END IF;
    IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
      RAISE EXCEPTION 'editors cannot change created_by';
    END IF;

    -- status transitions for editors
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NOT (
        (OLD.status = 'ASSIGNED' AND NEW.status = 'EDITING') OR
        (OLD.status = 'EDITING' AND NEW.status = 'QC') OR
        (OLD.status = 'REVISION_REQUESTED' AND NEW.status = 'EDITING')
      ) THEN
        RAISE EXCEPTION 'invalid editor status transition from % to %', OLD.status, NEW.status;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
