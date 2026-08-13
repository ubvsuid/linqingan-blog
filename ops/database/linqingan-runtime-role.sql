-- Least-privilege permission role for the linqingan.com server runtime.
--
-- This role is intentionally NOLOGIN: credentials stay out of source control.
-- A dedicated LOGIN role can be granted membership in linqingan_runtime when
-- the production DATABASE_URL is switched through the deployment platform.
-- On PostgreSQL 18, grant membership explicitly with:
--   GRANT linqingan_runtime TO <login_role>
--     WITH INHERIT TRUE, SET FALSE, ADMIN FALSE;
--
-- Evidence maintenance is intentionally excluded from this runtime role.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'linqingan_runtime') THEN
    CREATE ROLE linqingan_runtime
      NOLOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOINHERIT
      NOREPLICATION
      NOBYPASSRLS;
  END IF;
END
$$;

GRANT CONNECT ON DATABASE neondb TO linqingan_runtime;
GRANT USAGE ON SCHEMA public TO linqingan_runtime;

-- Remove broader grants left by an earlier version before rebuilding the
-- explicit allow-list below. This keeps repeat runs fail-closed.
REVOKE INSERT, UPDATE ON TABLE public.search_documents FROM linqingan_runtime;
REVOKE INSERT ON TABLE public.search_queries FROM linqingan_runtime;
REVOKE INSERT ON TABLE public.search_clicks FROM linqingan_runtime;
REVOKE SELECT, INSERT ON TABLE public.article_feedback FROM linqingan_runtime;
REVOKE INSERT ON TABLE public.tool_events FROM linqingan_runtime;

-- Search V2 reads and synchronizes the generated search corpus at runtime.
GRANT SELECT, DELETE ON TABLE public.search_documents TO linqingan_runtime;
GRANT INSERT (
  id,
  type,
  language,
  title,
  description,
  href,
  module,
  keywords,
  headings,
  search_text,
  source_updated_at,
  updated_at
) ON TABLE public.search_documents TO linqingan_runtime;
GRANT UPDATE (
  type,
  language,
  title,
  description,
  href,
  module,
  keywords,
  headings,
  search_text,
  source_updated_at,
  updated_at
) ON TABLE public.search_documents TO linqingan_runtime;

-- Search query analytics inserts a row and returns its generated id.
GRANT INSERT (
  anonymous_id,
  session_id,
  language,
  query,
  normalized_query,
  result_count,
  source_path
) ON TABLE public.search_queries TO linqingan_runtime;
GRANT SELECT (id) ON TABLE public.search_queries TO linqingan_runtime;

-- Search click analytics is append-only from the application runtime.
GRANT INSERT (
  search_query_id,
  anonymous_id,
  session_id,
  query,
  result_id,
  result_type,
  result_href,
  position
) ON TABLE public.search_clicks TO linqingan_runtime;

-- Article feedback can insert a new response or update an existing response
-- for the same anonymous visitor and article.
GRANT INSERT (
  article_slug,
  language,
  helpful,
  reason,
  anonymous_id,
  session_id
) ON TABLE public.article_feedback TO linqingan_runtime;
GRANT SELECT (id, article_slug, language, anonymous_id)
  ON TABLE public.article_feedback
  TO linqingan_runtime;
GRANT UPDATE (helpful, reason, session_id, created_at)
  ON TABLE public.article_feedback
  TO linqingan_runtime;

-- Tool telemetry is append-only from the application runtime.
GRANT INSERT (
  tool_id,
  action,
  source_path,
  anonymous_id,
  session_id,
  metadata
) ON TABLE public.tool_events TO linqingan_runtime;

-- The security-barrier view enforces both the public column projection and
-- status = 'accepted'. The base table remains maintenance-only.
REVOKE ALL PRIVILEGES ON TABLE public.verification_evidence
  FROM linqingan_runtime;
GRANT SELECT ON TABLE public.verification_evidence_public
  TO linqingan_runtime;

-- Identity-backed inserts require sequence USAGE.
GRANT USAGE ON SEQUENCE
  public.search_queries_id_seq,
  public.search_clicks_id_seq,
  public.article_feedback_id_seq,
  public.tool_events_id_seq
  TO linqingan_runtime;

-- Intentionally no privileges on public.verification_evidence or its sequence.
