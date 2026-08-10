# Platform data architecture

## Purpose

`linqingan.com` keeps published Screeps content static and versioned while adding a small PostgreSQL data layer for search, anonymous product telemetry, reader feedback, and runtime-verification evidence.

## Source-of-truth boundary

Markdown and repository data remain the source of truth for:

- articles and tutorials;
- public URLs and metadata;
- Knowledge modules;
- Screeps API/error/glossary reference data;
- Sitemap and hreflang discovery.

PostgreSQL must not become a prerequisite for rendering an article. A temporary database outage must not remove article content from the site or change Google-facing HTML.

## Runtime database

Production uses PostgreSQL hosted on Neon. Application code accesses it through Drizzle ORM and the Neon serverless HTTP driver.

Required runtime secret:

- `DATABASE_URL`

The value is never committed to GitHub. When `DATABASE_URL` is missing, database-backed features must degrade safely.

For rollout safety, new database integrations are first configured as a branch-scoped Vercel Preview environment variable and validated there before the same secret is enabled for Production. The Search V2 response exposes `X-Search-Source: static|database`, which is used during rollout verification.

Production rollout was enabled only after Preview database connectivity, 131-document synchronization, Search V2 smoke coverage, and Lighthouse CLS validation passed. A fresh Production deployment is required whenever `DATABASE_URL` is first added or rotated because Vercel environment-variable changes apply to subsequent deployments.

## Initial tables

- `search_documents`: searchable copies of public content metadata and compact recall text.
- `search_queries`: anonymous search terms, result counts, language, and source page.
- `search_clicks`: anonymous result-click signals joined to a search when possible.
- `article_feedback`: anonymous helpful/not-helpful feedback and reason category.
- `tool_events`: anonymous aggregate interactions with site tools.
- `verification_evidence`: controlled Screeps Console/live-runtime evidence records.

The first migration is versioned at `drizzle/0000_platform_foundation.sql`.

## Search V2

The public search page calls `/api/search` instead of downloading the complete full-text index into the browser.

Search V2 combines:

1. exact and prefix title matching;
2. keyword, description, module, and compact search-text matching;
3. PostgreSQL full-text ranking using the `simple` dictionary;
4. `pg_trgm` title similarity;
5. Screeps-specific Chinese/English synonym expansion.

The API returns at most a small result window. If PostgreSQL is unavailable, empty, or errors, the server uses the existing static search builder as a fallback. `/api/search-index` remains available during the migration cycle for rollback and parity checks.

## Privacy boundary

The initial platform layer does not create user accounts and does not intentionally store IP addresses, email addresses, Screeps tokens, account credentials, or private game data.

Browser-generated anonymous/session identifiers are used only to understand aggregate search and tool flows. They are not authentication credentials.

## Verification evidence boundary

`verification_evidence` is not a public anonymous-write surface. Evidence is added only through controlled maintenance workflows after real Screeps Console or multi-tick observations exist. Documentation checks and offline simulations must not be promoted to live evidence.

## Migration workflow

Schema changes should follow this sequence:

1. create a Neon temporary branch;
2. apply the proposed migration there;
3. verify tables, indexes, constraints, and representative queries;
4. obtain approval for production-impacting schema changes;
5. apply to the Neon main branch;
6. commit the reviewed SQL migration to this repository;
7. run site quality and production smoke tests.

## Future phases

After Search V2 is stable, the same data layer can support:

- zero-result and query-gap reports;
- article-feedback prioritization;
- tool usage ranking;
- Recently Verified evidence summaries;
- a private maintenance dashboard;
- later Search Console data imports.

User authentication, Redis, vector search, and AI retrieval are deliberately out of scope until real usage demonstrates a need.
