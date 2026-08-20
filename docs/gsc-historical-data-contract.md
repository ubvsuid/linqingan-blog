# GSC Historical Data Contract V1

Contract version: `gsc-page-query-v1`.

Accepted input:

- Search type: Web
- Country: All
- Device: All
- Dimensions: Page + Query
- one fact = one period + page + query

Device/country/search-type/date/search-appearance segmentation is rejected before persistence.

## Metrics

CTR is normalized internally as a ratio between 0 and 1. `1.2%` becomes `0.012`; reports display that ratio as `1.20%`. Clicks cannot exceed impressions and position must be null or positive.

## Authoritative ingestion

Use `scripts/site-intelligence-gsc-import.mjs` or the safe end-to-end runner. The importer is dry-run by default and writes only with `--commit`.

`search-console-opportunity-report.mjs` remains a compatibility/preview report. It uses the same ratio and language-scoped Owner semantics but does not persist historical facts.

If segmented analysis becomes necessary, introduce a new grain version before changing the uniqueness model.
