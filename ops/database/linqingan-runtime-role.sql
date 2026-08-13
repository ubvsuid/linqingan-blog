-- Least-privilege permission role for the linqingan.com server runtime.
--
-- This role is intentionally NOLOGIN: credentials stay out of source control.
-- A dedicated LOGIN role can be granted membership in linqingan_runtime when
-- the production DATABASE_URL is switched through the deployment platform.
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

-- Search V2 reads and synchronizes the generated search corpus at runtime.
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.search_documents
  TO linqingan_runtime;

-- Search query analytics inserts a row and returns its generated id.
GRANT INSERT ON TABLE public.search_queries TO linqingan_runtime;
GRANT SELECT (id) ON TABLE public.search_queries TO linqingan_runtime;

-- Search click analytics is append-only from the application runtime.
GRANT INSERT ON TABLE public.search_clicks TO linqingan_runtime;

-- Article feedback can insert a new response or update an existing response
-- for the same anonymous visitor and article.
GRANT SELECT, INSERT ON TABLE public.article_feedback TO linqingan_runtime;
GRANT UPDATE (helpful, reason, session_id, created_at)
  ON TABLE public.article_feedback
  TO linqingan_runtime;

-- Tool telemetry is append-only from the application runtime.
GRANT INSERT ON TABLE public.tool_events TO linqingan_runtime;

-- Identity-backed inserts require sequence USAGE.
GRANT USAGE ON SEQUENCE
  public.search_queries_id_seq,
  public.search_clicks_id_seq,
  public.article_feedback_id_seq,
  public.tool_events_id_seq
  TO linqingan_runtime;

-- Intentionally no privileges on public.verification_evidence or its sequence.
