# Knowledge metadata migration bridge

This directory is a temporary compatibility layer for articles migrated to the Knowledge Registry without rewriting their Markdown files solely to move metadata.

The shared field contract for article frontmatter, `knowledge`, `roadmap`, `seo`, and `verification` is governed by `docs/content-metadata-schema-v1.md`. This README documents Knowledge-specific ownership and migration behavior only; it must not redefine the shared schema independently.

## Source-of-truth boundaries

Knowledge now has two deliberately separate metadata authorities:

- Editorial metadata (`knowledge` + `seo`) lives in either Markdown frontmatter or one migration sidecar in this directory, never both.
- Permanent content identity lives only in `content/knowledge-identities.json`.

The identity registry is **not** another editorial metadata source. It owns only `contentId` and `contentGroupId`, so moving an article from a migration sidecar into Markdown frontmatter never changes its permanent identity.

Runtime rules:

- New or substantively edited articles should declare `knowledge` and `seo` together in Markdown frontmatter.
- A published article may use either inline frontmatter or one migration sidecar, never both.
- Once an article receives inline `knowledge`/`seo`, delete its sidecar in the same change.
- Each sidecar filename must exactly match the article slug: `<article-slug>.json`.
- Every published Knowledge article must have exactly one record in `content/knowledge-identities.json`.
- `contentId` identifies one concrete article record and must never be regenerated because the slug, title, path, module, stage, or SEO metadata changes.
- `contentGroupId` identifies the underlying knowledge topic. A future confirmed translation receives its own `contentId` and may share the source article's `contentGroupId`.
- On a slug rename, update the identity record's `slug` locator but preserve both permanent IDs.
- Never infer translation groups from similar titles or slugs. Use the established English article mapping as the confirmation boundary.
- `npm run knowledgegenerate` validates Content Metadata Schema V1, then converts inline/sidecar metadata plus Content Identity V1 into the generated static article registry used by the site.
- `npm run knowledgecheck` validates Content Identity V1, module/stage membership, unique module ordering, metadata shape, Owner keyword uniqueness, and prevents metadata modules from returning to legacy slug/range ownership.
- New valid Knowledge articles may be added without editing the checker; the module and stage must already exist, the new `knowledge.order` must not conflict inside that module, and a permanent identity must be allocated before generation succeeds.

Required sidecar/frontmatter shape:

```json
{
  "knowledge": {
    "module": "spawn-lifecycle",
    "stage": "create-queue",
    "order": 10,
    "difficulty": "intermediate"
  },
  "seo": {
    "primaryKeyword": "Screeps spawnCreep return codes",
    "searchIntent": "Describe the specific user problem this page owns",
    "keywordRole": "owner"
  }
}
```

Required identity shape:

```json
{
  "slug": "screeps-spawncreep-return-codes",
  "contentId": "article_<uuid>",
  "contentGroupId": "group_<uuid>"
}
```

Required fields:

- `knowledge.module`: existing Knowledge Module ID.
- `knowledge.stage`: stage ID defined by that module.
- `knowledge.order`: unique integer ordering value inside the module.
- `knowledge.difficulty`: one of `beginner`, `intermediate`, or `advanced`.
- `seo.primaryKeyword`: the page's primary/Owner keyword phrase.
- `seo.searchIntent`: the specific search problem or intent owned by the page.
- `seo.keywordRole`: one of `owner` or `supporting`.
- `contentId`: globally unique `article_` + UUID identifier for the concrete article.
- `contentGroupId`: `group_` + UUID identifier for the underlying topic.

`seo` is shared by the Knowledge and Roadmap metadata systems, but membership is namespace-specific: `knowledge + seo` enters Knowledge; `roadmap + seo` enters a Roadmap. Each generator ignores the other namespace unless a conflicting migration sidecar is present.

The sidecars do not change article freshness, body content, canonical URLs, or public rendering. They only supply migration metadata until each article next receives a substantive content revision. `content/knowledge-identities.json` is the permanent identity Source of Truth. `src/generated/knowledge-article-registry.json` is generated build output and is not an editorial or identity Source of Truth.
