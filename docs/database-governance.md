# Database governance

This document defines the production database boundaries for `linqingan.com`.

## Source-of-truth boundary

Markdown and repository content remain the source of truth for published content. Neon stores generated search documents, platform telemetry, article feedback, and Runtime Evidence lifecycle records.

Do not turn the database into a second CMS.

## Runtime permission boundary

The website runtime must not connect as `neondb_owner` long term.

`ops/database/linqingan-runtime-role.sql` defines the reusable `linqingan_runtime` permission role. It is intentionally `NOLOGIN` so credentials never live in source control.

Current runtime capabilities are limited to what the application code requires:

- `search_documents`: read and synchronize the generated Chinese search corpus.
- `search_queries`: append search-query analytics and return the generated row id.
- `search_clicks`: append click analytics.
- `article_feedback`: read/insert feedback and update the fields used when the same anonymous visitor revises a response.
- `tool_events`: append tool telemetry.
- `verification_evidence_public`: read accepted rows through a security-barrier view containing public fields only. The base Evidence table, internal snapshots, source references, review metadata, lifecycle writes, and the identity sequence remain maintenance-only.

A future production login role should inherit `linqingan_runtime`; the owner role remains for migrations and administrative maintenance only. Create the login with SQL, stage it as `NOLOGIN`, and set its password through an interactive direct client so the secret is not recorded in repository, command, or SQL-tool history. Validate a fresh pooled connection before changing any deployment secret.

## Data retention policy

Raw platform telemetry has a finite retention period because long-lived anonymous/session identifiers and raw queries are not required indefinitely.

| Dataset | Retention | Rationale |
| --- | ---: | --- |
| `search_clicks` | 180 days | Enough history for search-quality analysis without indefinite raw click storage. |
| `search_queries` | 180 days | Enough history for zero-result and search-intent analysis. |
| `tool_events` | 180 days | Enough history for tool adoption trends. |
| `article_feedback` | 365 days | Longer window supports editorial follow-up while remaining finite. |
| `search_documents` | No time-based retention | Generated/synchronized index, not telemetry. |
| `verification_evidence` | No automatic deletion | Audit/review record; lifecycle is managed explicitly through evidence status. |

These periods are engineering defaults, not a statement of legal requirements. Revisit them if account features, user identity, regulatory scope, or analytics requirements materially change.

## Retention maintenance

`scripts/platform-data-retention.mjs` is report-only by default. It prints aggregate expired-row counts and never prints raw query, session, anonymous-id, or feedback content.

Run retention maintenance with an administrative or dedicated maintenance credential, not with a website login that only inherits `linqingan_runtime`. The runtime permission role intentionally lacks the broad telemetry read/delete privileges required by cleanup operations.

Deletion requires both:

1. the `--apply` command-line flag; and
2. `PLATFORM_RETENTION_CONFIRM=DELETE_EXPIRED_PLATFORM_EVENTS`.

This double guard is intentional. Do not schedule deletion until report-only runs have been reviewed against production data.

The maintenance order deletes expired click rows before query rows. The existing foreign key also uses `ON DELETE SET NULL`, so retained click records would not become invalid if the policy changes later.

## Branch and restore policy

- Use disposable Neon branches for migration and destructive-operation validation whenever practical.
- Treat `main` as production data.
- Do not enable network allowlists without a verified production egress strategy.
- Prefer the longest practical restore window supported by the active Neon plan and budget.
- Protected-branch controls should be enabled when the active Neon plan supports them and the project is intended to remain production-critical.

As of 2026-08-13 the project uses Neon's Free plan. Its six-hour history window is already at the plan maximum, and protected branches are unavailable. Do not shorten or disable the history window. Re-evaluate a seven-day window and main-branch protection before or immediately after a paid-plan upgrade.

## Deferred controls

The following are intentionally deferred until there is evidence they are needed:

- RLS for the server-only application path.
- Table partitioning or sharding.
- Compute upgrades or PostgreSQL tuning.
- Removal of search GIN/trigram/FTS indexes based only on low early `idx_scan` counts.
- Analytics aggregation tables before enough telemetry exists to justify them.
