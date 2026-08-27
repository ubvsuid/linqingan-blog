-- Evidence Model V1
-- Anchor structured runtime Evidence to permanent Content Identity instead of mutable slug.
-- Existing evidence_key values remain immutable audit identifiers (identity_version=1).
-- New captures use identity_version=2 and derive evidence keys from content_id.

ALTER TABLE public.verification_evidence
  ADD COLUMN IF NOT EXISTS identity_version integer,
  ADD COLUMN IF NOT EXISTS content_id text,
  ADD COLUMN IF NOT EXISTS content_group_id text;

UPDATE public.verification_evidence
SET identity_version = COALESCE(identity_version, 1)
WHERE identity_version IS NULL;

-- Backfill the only legacy article locators present when Evidence Model V1 was authored.
-- The fail-closed guard below aborts if additional unmapped rows exist at apply time.
UPDATE public.verification_evidence AS evidence
SET
  content_id = mapping.content_id,
  content_group_id = mapping.content_group_id
FROM (
  VALUES
    (
      'screeps-upgrade-controller',
      'article_d5c705cf-f064-4e8d-82b5-7d5ee61faef7',
      'group_4e646ba0-1717-4c11-b8cd-c756a2c9d78f'
    ),
    (
      'screeps-spawn-create-creep',
      'article_05115243-96ad-452e-b184-dd17cf8b09a7',
      'group_92e6d4a7-8a6b-4763-a788-070c8beee498'
    )
) AS mapping(article_slug, content_id, content_group_id)
WHERE evidence.article_slug = mapping.article_slug
  AND (evidence.content_id IS NULL OR evidence.content_group_id IS NULL);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.verification_evidence
    WHERE content_id IS NULL OR content_group_id IS NULL
  ) THEN
    RAISE EXCEPTION
      'Evidence Model V1 migration stopped: one or more legacy evidence rows lack a permanent Content Identity mapping.';
  END IF;
END
$$;

ALTER TABLE public.verification_evidence
  ALTER COLUMN identity_version SET DEFAULT 2,
  ALTER COLUMN identity_version SET NOT NULL,
  ALTER COLUMN content_id SET NOT NULL,
  ALTER COLUMN content_group_id SET NOT NULL;

ALTER TABLE public.verification_evidence
  DROP CONSTRAINT IF EXISTS verification_evidence_identity_version_check,
  DROP CONSTRAINT IF EXISTS verification_evidence_type_check,
  DROP CONSTRAINT IF EXISTS verification_evidence_language_check,
  DROP CONSTRAINT IF EXISTS verification_evidence_content_id_check,
  DROP CONSTRAINT IF EXISTS verification_evidence_content_group_id_check;

ALTER TABLE public.verification_evidence
  ADD CONSTRAINT verification_evidence_identity_version_check
    CHECK (identity_version IN (1, 2)) NOT VALID,
  ADD CONSTRAINT verification_evidence_type_check
    CHECK (verification_type IN ('console', 'live')) NOT VALID,
  ADD CONSTRAINT verification_evidence_language_check
    CHECK (language IN ('zh-CN', 'en')) NOT VALID,
  ADD CONSTRAINT verification_evidence_content_id_check
    CHECK (content_id ~ '^article_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') NOT VALID,
  ADD CONSTRAINT verification_evidence_content_group_id_check
    CHECK (content_group_id ~ '^group_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') NOT VALID;

ALTER TABLE public.verification_evidence
  VALIDATE CONSTRAINT verification_evidence_identity_version_check;
ALTER TABLE public.verification_evidence
  VALIDATE CONSTRAINT verification_evidence_type_check;
ALTER TABLE public.verification_evidence
  VALIDATE CONSTRAINT verification_evidence_language_check;
ALTER TABLE public.verification_evidence
  VALIDATE CONSTRAINT verification_evidence_content_id_check;
ALTER TABLE public.verification_evidence
  VALIDATE CONSTRAINT verification_evidence_content_group_id_check;

DROP INDEX IF EXISTS public.verification_evidence_identity_uidx;
CREATE UNIQUE INDEX verification_evidence_identity_uidx
  ON public.verification_evidence(
    content_id,
    verification_type,
    api_name,
    source_ref,
    COALESCE(game_time, -1),
    COALESCE(tick_start, -1),
    COALESCE(tick_end, -1)
  );

CREATE INDEX IF NOT EXISTS verification_evidence_content_idx
  ON public.verification_evidence(content_id, verified_at DESC);

CREATE INDEX IF NOT EXISTS verification_evidence_public_content_idx
  ON public.verification_evidence(content_id, verified_at DESC)
  WHERE status = 'accepted';

-- Append durable identity columns so CREATE OR REPLACE VIEW preserves the existing
-- public view's established column order while extending it safely.
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
  verified_at,
  identity_version,
  content_id,
  content_group_id
FROM public.verification_evidence
WHERE status = 'accepted';

REVOKE ALL PRIVILEGES ON TABLE public.verification_evidence_public FROM PUBLIC;
