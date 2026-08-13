-- Platform telemetry integrity constraints.
-- Production application: Neon migration 03e1341c-144f-43d3-8c1c-1108d86f0e44.
-- These checks reject only clearly invalid negative analytics values without
-- imposing a 0-based or 1-based interpretation on click positions.

ALTER TABLE public.search_queries
  DROP CONSTRAINT IF EXISTS search_queries_result_count_nonnegative;

ALTER TABLE public.search_queries
  ADD CONSTRAINT search_queries_result_count_nonnegative
  CHECK (result_count >= 0) NOT VALID;

ALTER TABLE public.search_queries
  VALIDATE CONSTRAINT search_queries_result_count_nonnegative;

ALTER TABLE public.search_clicks
  DROP CONSTRAINT IF EXISTS search_clicks_position_nonnegative;

ALTER TABLE public.search_clicks
  ADD CONSTRAINT search_clicks_position_nonnegative
  CHECK (position >= 0) NOT VALID;

ALTER TABLE public.search_clicks
  VALIDATE CONSTRAINT search_clicks_position_nonnegative;
