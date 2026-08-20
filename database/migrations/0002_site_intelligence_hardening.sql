-- First incremental migration after the 2026-08-20 production baseline.
-- Protect lifecycle state and GSC metric invariants even when writes bypass application CLIs.

ALTER TABLE site_intelligence_actions
  ADD CONSTRAINT site_intelligence_actions_done_requires_completed_at
  CHECK (status <> 'done' OR completed_at IS NOT NULL);

ALTER TABLE site_intelligence_actions
  ADD CONSTRAINT site_intelligence_actions_result_requires_done
  CHECK (result IS NULL OR status = 'done');

ALTER TABLE site_intelligence_actions
  ADD CONSTRAINT site_intelligence_actions_superseded_requires_target
  CHECK (status <> 'superseded' OR superseded_by_action_id IS NOT NULL);

ALTER TABLE site_intelligence_gsc_observations
  ADD CONSTRAINT site_intelligence_gsc_ctr_upper_bound
  CHECK (ctr <= 1);

ALTER TABLE site_intelligence_gsc_observations
  ADD CONSTRAINT site_intelligence_gsc_clicks_not_above_impressions
  CHECK (clicks <= impressions);

ALTER TABLE site_intelligence_gsc_observations
  ADD CONSTRAINT site_intelligence_gsc_position_positive
  CHECK (position IS NULL OR position > 0);
