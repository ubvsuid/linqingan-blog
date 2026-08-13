-- Expose only accepted Evidence fields required by the public website.
-- The security barrier prevents caller predicates from being pushed below the
-- status filter. Runtime roles receive access to this view, never the base table.

CREATE OR REPLACE VIEW public.verification_evidence_public
WITH (security_barrier = true)
AS
SELECT
  id,
  evidence_key,
  article_slug,
  language,
  verification_type,
  game_time,
  shard,
  room_name,
  api_name,
  return_code,
  tick_start,
  tick_end,
  evidence_note,
  verified_at
FROM public.verification_evidence
WHERE status = 'accepted';

REVOKE ALL PRIVILEGES ON TABLE public.verification_evidence_public FROM PUBLIC;
