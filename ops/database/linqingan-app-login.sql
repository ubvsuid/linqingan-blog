-- Inert production login principal for the linqingan.com website runtime.
--
-- This script intentionally creates the principal as NOLOGIN with no password.
-- Set a high-entropy password through an interactive direct PostgreSQL client,
-- then enable LOGIN. Validate fresh pooled and direct connections before any
-- deployment secret is changed.
-- Never put the password in this file or a recorded SQL command.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'linqingan_app') THEN
    CREATE ROLE linqingan_app
      NOLOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      INHERIT
      NOREPLICATION
      NOBYPASSRLS;
  END IF;
END
$$;

GRANT linqingan_runtime TO linqingan_app
  WITH INHERIT TRUE, SET FALSE, ADMIN FALSE;
