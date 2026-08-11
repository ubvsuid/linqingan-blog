-- Verification evidence governance hardening.
-- This migration adds stable evidence identities, internal lifecycle state,
-- database-level duplicate protection, and review/revocation metadata.
-- Public verification still requires Markdown acceptance; database status alone is not public truth.

ALTER TABLE verification_evidence
  ADD COLUMN IF NOT EXISTS evidence_key text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'captured',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_note text,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_reason text;

-- Safe legacy backfill. The production table was empty when this migration was authored,
-- but legacy rows receive a deterministic non-null key if any exist at apply time.
UPDATE verification_evidence
SET evidence_key = 'EV-LEGACY-' || lpad(id::text, 12, '0')
WHERE evidence_key IS NULL;

ALTER TABLE verification_evidence
  ALTER COLUMN evidence_key SET NOT NULL,
  ALTER COLUMN api_name SET NOT NULL,
  ALTER COLUMN evidence_note SET NOT NULL,
  ALTER COLUMN source_ref SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_evidence_status_check'
  ) THEN
    ALTER TABLE verification_evidence
      ADD CONSTRAINT verification_evidence_status_check
      CHECK (status IN ('captured', 'reviewed', 'accepted', 'rejected', 'revoked'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS verification_evidence_key_uidx
  ON verification_evidence(evidence_key);

-- Identity-level duplicate protection remains effective even when optional tick fields are null.
CREATE UNIQUE INDEX IF NOT EXISTS verification_evidence_identity_uidx
  ON verification_evidence(
    article_slug,
    verification_type,
    api_name,
    source_ref,
    COALESCE(game_time, -1),
    COALESCE(tick_start, -1),
    COALESCE(tick_end, -1)
  );

CREATE INDEX IF NOT EXISTS verification_evidence_status_idx
  ON verification_evidence(status, verified_at DESC);

CREATE INDEX IF NOT EXISTS verification_evidence_public_article_idx
  ON verification_evidence(article_slug, verified_at DESC)
  WHERE status = 'accepted';
