-- Phase 1: Kanban evidence enforcement + mentor approval + project completion tracking
-- Teens must attach evidence to move a card from todo → in_progress
-- Teens request approval to move in_progress → done; mentor approves/rejects
-- When all tasks in a project are done, project is marked complete
-- First project completion stamps profiles.first_project_completed_at (unlocks map)

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS awaiting_approval boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approval_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS mentor_approved_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS mentor_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS mentor_rejection_reason text;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS is_complete boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_project_completed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_tasks_awaiting_approval
  ON public.tasks (project_id) WHERE awaiting_approval = true;

-- Trigger: when a project's tasks are all done, flip is_complete and stamp the teen's
-- first_project_completed_at (idempotent — only sets if null)
CREATE OR REPLACE FUNCTION public.check_project_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id uuid;
  v_teen_id uuid;
  v_total int;
  v_done int;
BEGIN
  v_project_id := COALESCE(NEW.project_id, OLD.project_id);

  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'done')
    INTO v_total, v_done
    FROM public.tasks WHERE project_id = v_project_id;

  IF v_total > 0 AND v_done = v_total THEN
    UPDATE public.projects
      SET is_complete = true,
          status = 'completed',
          completed_at = COALESCE(completed_at, NOW())
      WHERE id = v_project_id AND is_complete = false
      RETURNING teen_id INTO v_teen_id;

    IF v_teen_id IS NOT NULL THEN
      UPDATE public.profiles
        SET first_project_completed_at = NOW()
        WHERE id = v_teen_id AND first_project_completed_at IS NULL;
    END IF;
  ELSE
    UPDATE public.projects
      SET is_complete = false
      WHERE id = v_project_id AND is_complete = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_project_completion ON public.tasks;
CREATE TRIGGER trg_check_project_completion
  AFTER INSERT OR UPDATE OF status OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.check_project_completion();
