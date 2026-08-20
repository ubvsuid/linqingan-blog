# Database schema and migrations

This directory is the Git source of truth for reconstructing the `linqingan-platform` PostgreSQL schema. It contains schema only: never commit row exports, credentials, connection strings, or Neon secrets here.

## Baseline policy

The ordered `0001a`/`0001b`/`0001c` files form one factual baseline captured from production `neondb` on 2026-08-20, before hardening migration 0002. It is not a reconstructed story of older migrations.

The baseline was replay-tested from an empty database on a Neon temporary branch. After applying 0001 and 0002, the rebuilt database matched the target branch by table names, view names, index names, and non-NOT-NULL constraint names.

## Migration policy

From 0002 onward, every production schema change must have a sequential SQL migration in this directory before or in the same PR as the code that depends on it.

Rules:

- migrations are append-only after production application;
- never edit an already-applied migration to change history;
- create the next numbered migration instead;
- test migrations on a Neon temporary branch before production;
- keep migration SQL free of credentials and row data;
- ordinary Action Lifecycle data changes do not belong in migrations.

## Rebuild sequence

On a fresh PostgreSQL 18 database, run migration files in lexical order:

```text
0001a_production_baseline_core_20260820.sql
0001b_production_baseline_intelligence_20260820.sql
0001c_production_baseline_indexes_views_20260820.sql
0002_site_intelligence_hardening.sql
...future migrations...
```

The baseline includes the `pg_trgm` extension required by internal search indexes.

## GSC warehouse boundary

The historical GSC warehouse V1 has one accepted grain: `gsc-page-query-v1`.

- Search type: Web
- Country: All
- Device: All
- Dimensions: Page + Query

Country/device/search-type segmented exports must not be inserted into the V1 fact table. If those dimensions become necessary later, create a new migration and a new grain contract before importing them.
