# Search Index V2 plan

## Current contract

The Chinese search endpoint remains `/api/search-index` and stays backward compatible until V2 is proven in production.

- Soft warning threshold: **163,840 bytes (160 KiB)**
- Hard build/runtime budget: **196,608 bytes (192 KiB)**
- The endpoint exposes current bytes, warning bytes, hard-budget bytes, and remaining headroom in response headers.

## Trigger

Start the V2 migration when either condition becomes true:

1. the generated payload reaches or exceeds 160 KiB; or
2. real-user search loading shows a meaningful regression before that threshold.

Do not wait for the 192 KiB hard limit to fail.

## V2 shape

Keep a small core document contract:

```ts
interface SearchDocumentV2 {
  id: string;
  type: string;
  title: string;
  description: string;
  href: string;
  meta: string;
  keywords: string[];
}
```

Move longer article-only recall text out of the first request.

Recommended static shards:

- `/api/search-index/articles`
- `/api/search-index/reference`
- `/api/search-index/tools`

The initial search page should load only the compact core index. A shard is fetched only after the user enters a query or selects a matching content type.

## Migration sequence

1. Add V2 shard builders beside the existing index.
2. Add byte budgets for every shard and for their combined size.
3. Keep `/api/search-index` unchanged while the V2 client runs behind a local feature flag.
4. Compare result parity for the site's popular queries and typo/synonym cases.
5. Compare real-user load and interaction metrics.
6. Switch the search client to V2 only after parity and performance checks pass.
7. Retire the old full payload after at least one stable production cycle.

## Guardrails

- Never remove article titles, descriptions, tags, category/module context, or API/error/tool keywords from the compact index.
- Do not send private data or account information to the search index.
- Search analytics and zero-result analytics must remain separate from the index payload.
- A V2 migration must not change public search URLs or canonical/indexing behavior.
