# Site Intelligence Integration V2

This document defines the production operating chain after Integration Hardening.

## Canonical flow

`Content/registries -> Site Asset Master V2 -> Historical GSC / first-party behavior / Runtime Evidence -> Signals V2 -> Action Queue V2 -> Lifecycle -> Before/After review`

Historical GSC follows a separate ingestion boundary before Signals:

`GSC Page+Query CSV -> Historical Importer -> Import Run + GSC Warehouse + Data Quality + Relationships -> Signals`

## Identity rules

- Asset IDs include language (`zh-CN:*`, `en:*`).
- English article identity comes from the existing English article registries and retains its Chinese source pair.
- Signal IDs are semantic hashes. Input array ordering is never part of identity.
- Action IDs are semantic hashes of the issue identity. Mutable metrics and row ordering are never part of identity.
- Error Code and Glossary items are fragment assets under their canonical hub pages.

## Language safety

Owner lookup is language-scoped. A GSC English page can only be compared with an English Owner. A cross-language route pair cannot create a cannibalization P0 merely because both pages target similar text.

If a same-language Owner cannot be resolved, the row becomes a mapping/research review rather than keyword-cannibalization P0.

## Metric contract

CTR is a ratio internally (`0 <= ctr <= 1`). For example, `1.2%` is stored and processed as `0.012`. Reports convert the ratio back to a percentage only for display.

The Historical Warehouse remains `gsc-page-query-v1`: Web, Country=All, Device=All, Page+Query only.

## Behavior maturity

Internal Search requires both:

1. the source-level observation minimum; and
2. the individual query row minimum.

The current operational minimum remains 20. A single query cannot become actionable only because unrelated searches pushed the whole source above the threshold.

## Atomic writes

Historical Importer writes Import Run, GSC facts, deterministic Data Quality changes, and relationships in one transaction.

Lifecycle Sync writes snapshots plus machine-owned Action/Event changes in one transaction. Action Update writes the human lifecycle mutation and all matching audit Events in one transaction.

If any statement fails, the write batch rolls back.

## Safe runner

Preview/read-only mode is the default:

```bash
DATABASE_URL=... node scripts/site-intelligence-run.mjs
```

Preview a new GSC export without writing it:

```bash
DATABASE_URL=... node scripts/site-intelligence-run.mjs \
  --gsc-input ./gsc.csv \
  --period-start 2026-07-01 \
  --period-end 2026-07-28
```

Commit Historical GSC plus Lifecycle only with explicit `--commit`:

```bash
DATABASE_URL=... node scripts/site-intelligence-run.mjs \
  --gsc-input ./gsc.csv \
  --period-start 2026-07-01 \
  --period-end 2026-07-28 \
  --commit
```

The runner never edits articles, titles, URLs, canonicals, redirects, or deployments.

## Permanent regression boundaries

CI must keep these properties true:

- reordered facts keep the same Signal IDs and Action IDs;
- English/Chinese route pairs do not create cross-language cannibalization P0;
- CTR conversion remains `1.2% -> 0.012 -> 1.20%`;
- segmented GSC grain is rejected;
- low per-query behavior remains observe-only;
- repeated Historical GSC facts keep stable row identity;
- unmapped data is retained in Data Quality and can be deterministically resolved after mapping improves;
- Lifecycle writes are transactional;
- machine sync preserves human status and never auto-closes missing Actions;
- no composite AI/SEO score is introduced;
- no content or deployment change is automated.
