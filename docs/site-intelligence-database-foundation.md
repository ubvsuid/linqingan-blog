# Site Intelligence Database Foundation

This is the final foundation layer before historical-data ingestion. It is intentionally optimized for a single operator and avoids team assignment, approval, or permission fields.

## Added operating structures

### Action timing

`site_intelligence_actions` gains an optional Due Date plus parent/superseded relationships. `site_intelligence_action_operating_view` derives age, operating timing state, and review-due state at query time so changing values such as `aging_days` are never stored as stale data.

### Import / sync history

`site_intelligence_import_runs` records each ingestion attempt with source, optional file/period, input fingerprint, status, row counts, and notes. Duplicate fingerprints are observable but not forbidden because the same source file may legitimately be reprocessed after mapping rules improve.

### Data-quality queue

`site_intelligence_data_quality_issues` preserves unmapped or structurally invalid data instead of dropping it. A stable issue fingerprint allows repeated occurrences to increment one issue's count and last-seen time rather than creating unlimited duplicates.

### GSC historical warehouse

`site_intelligence_gsc_observations` stores period + page + query performance together with Asset/Owner mapping state and source import provenance. The period/page/query key is idempotent, allowing a later re-import to correct mappings without doubling clicks or impressions.

`site_intelligence_gsc_period_summary` is a read-only aggregate view for period-level trend checks.

The V1 warehouse is governed by `gsc-page-query-v1`: Web search, Country=All, Device=All, and exactly Page + Query dimensions. Segmented exports are rejected before persistence. See `docs/gsc-historical-data-contract.md`.

### Relationship graph

`site_intelligence_relationships` stores explainable relationships between Assets, keywords, and paths. Relationship basis is explicit (`metadata`, `registry`, `content_link`, `keyword_owner`, `runtime_evidence`, or `manual`) instead of an invented confidence score.

Examples include:

- Article -> references -> API Hub
- Article -> supports -> Tool
- Article -> solves -> Diagnostic
- Keyword -> owned_by -> Article
- Path -> redirects_to -> Path

### Action relationship graph

`site_intelligence_action_links` stores operational links between Actions: `related`, `blocks`, `duplicate_of`, and `follow_up`.

## Database reconstruction baseline

The production schema is versioned under `database/migrations/`.

- `0001a` + `0001b` + `0001c` form the factual production baseline captured before hardening.
- `0002_site_intelligence_hardening.sql` is the first incremental migration.

The migration chain was replay-tested on an empty Neon database. The rebuilt schema matched the target temporary branch by table names, view names, index names, and non-NOT-NULL constraint names.

Future production schema changes must add a new sequential migration instead of editing an already-applied migration.

## Hardening invariants

Database-level checks protect the minimum invariants that should remain true even when a write bypasses the normal CLI:

- a Done Action has a completion timestamp;
- an Action result can exist only on Done;
- a Superseded Action references its replacement;
- GSC CTR is at most 1;
- GSC clicks do not exceed impressions;
- GSC position is null or positive.

More detailed workflow policy remains in the application layer to avoid over-constraining the database.

## Safety boundaries

- no automatic content creation;
- no automatic title/URL/canonical/redirect changes;
- no automatic Action close or priority change;
- no composite AI score;
- unmapped rows are preserved for review;
- historical facts keep import provenance;
- reports are read-only.

## Read-only report

```bash
DATABASE_URL=... node scripts/site-intelligence-foundation-report.mjs
```

It summarizes Action timing, recent/duplicate imports, open data-quality issues, GSC periods, Asset relationships, and Action links.

## Historical-data phase

After this foundation is deployed, historical GSC/Excel/Evidence data can be processed through a consistent sequence:

`Import Run -> normalize/dedupe -> Asset/Owner mapping -> GSC facts / relationships -> Data Quality queue -> Signals -> Action Queue -> Lifecycle -> Before/After review`
