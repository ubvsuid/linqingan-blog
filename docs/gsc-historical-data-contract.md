# GSC Historical Data Contract V1

The Site Intelligence historical warehouse intentionally uses one stable Search Console grain so period comparisons and the uniqueness key cannot mix incompatible exports.

## Contract

Contract version: `gsc-page-query-v1`

Accepted input:

- Google Search type: **Web**
- Country: **All**
- Device: **All**
- Dimensions: **Page + Query**, in that order
- one observation represents one period + page + query fact

Rejected before persistence:

- Mobile/Desktop/Tablet segmentation;
- country-specific rows;
- Image, Video, News, Discover, or other search types;
- Date, Search Appearance, or extra dimensions;
- page-only rows with no query.

## Why the contract is strict

The V1 warehouse uniqueness key is period + page + query. Allowing device or country segmentation without adding those dimensions to the key would collapse different facts into one row and corrupt trend totals.

The contract therefore rejects segmented data instead of silently aggregating or overwriting it.

## Metric invariants

Database hardening also enforces basic GSC facts:

- CTR is between 0 and 1;
- clicks cannot exceed impressions;
- average position is null or positive.

These checks catch column-mapping errors early. They do not validate Google Search Console methodology or claim statistical significance.

## Future expansion

If device/country/search-type analysis becomes operationally necessary, do not overload V1. Introduce a new grain version and migrate the uniqueness model explicitly first.
