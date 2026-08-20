# Site Asset Master

The Site Asset Master is the read-only composition layer for Linqingan's website knowledge assets. It does not replace the existing Knowledge metadata, Beginner Roadmap metadata, tool catalog, diagnostic registry, or API Hub registry. Those remain the source of truth for their own domains.

## Purpose

The Asset Master gives SEO, internal-search, verification, and future Action Queue reports one stable asset identity model instead of making every report infer the site independently.

Each asset has stable fields such as:

- `assetId`
- `assetType`
- `language`
- `path`
- `canonicalPath`
- `routeKind`
- `title`
- `contentSystem`
- `module` / `roadmap`
- `stage`
- `order`
- `difficulty`
- `primaryKeyword`
- `keywordRole`
- `searchIntent`
- `metadataSource`
- `sourceOfTruth`
- `parentPath`
- `joinKeys`
- `decision`

## Source-of-truth rules

The Asset Master must compose existing sources rather than duplicate them:

- Knowledge articles: generated Knowledge registry + article frontmatter title
- Beginner articles: generated Beginner Roadmap registry + article frontmatter title
- Tools: `src/lib/tool-catalog.ts`
- Diagnostic symptom nodes: `src/lib/screeps-diagnostic-symptoms.ts`
- API object hubs: `src/lib/screeps-api-hubs.ts`
- Core hubs: canonical application routes

A diagnostic symptom is a `fragment` asset under `/diagnostics`, not an independent indexable page. This distinction is intentional.

## Decision hooks

Version 1 exposes empty machine-readable decision hooks:

```json
{
  "health": {
    "content": "not-scored",
    "evidence": "not-scored",
    "indexation": "not-scored"
  },
  "opportunity": {
    "priority": null,
    "reasons": []
  }
}
```

These values must not be filled with guessed scores. Later work can join real GSC, internal-search, verification, tool-use, and feedback signals by `joinKeys.path` and `joinKeys.ownerKeyword`.

## Commands

Validate integrity:

```bash
node scripts/check-site-asset-master.mjs
```

Print a Markdown summary:

```bash
node scripts/site-asset-master-report.mjs
```

Write machine-readable JSON and Markdown:

```bash
node scripts/site-asset-master-report.mjs reports/site-assets.json reports/site-assets.md
```

## Version 1 boundary

This foundation deliberately does not:

- calculate SEO Opportunity scores;
- read private Search Console data directly;
- read Neon behavior data;
- change article content, title, URL, or `updatedAt`;
- change frontend rendering;
- invent standalone routes for fragment-only diagnostic nodes;
- duplicate Error or Glossary item registries before a stable canonical source is wired in.

The next layer should consume the Asset Master and the existing GSC/internal-search/verification reports to build an evidence-backed Action Queue.
