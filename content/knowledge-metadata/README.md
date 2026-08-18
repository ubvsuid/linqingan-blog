# Knowledge metadata migration bridge

This directory is a temporary compatibility layer for articles migrated to the Knowledge Registry without rewriting their Markdown files solely to move metadata.

Runtime rules:

- New or substantively edited articles should declare `knowledge` and `seo` together in Markdown frontmatter.
- A published article may use either inline frontmatter or one migration sidecar, never both.
- Once an article receives inline `knowledge`/`seo`, delete its sidecar in the same change.
- Each sidecar filename must exactly match the article slug: `<article-slug>.json`.
- `npm run knowledgegenerate` converts inline/sidecar metadata into the generated static article registry used by the site.
- `npm run knowledgecheck` enforces the single-source rule and the Spawn pilot parity contract.

Required sidecar shape:

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

Required fields:

- `knowledge.module`: existing Knowledge Module ID.
- `knowledge.stage`: stage ID defined by that module.
- `knowledge.order`: unique integer ordering value inside the module.
- `knowledge.difficulty`: one of `beginner`, `intermediate`, or `advanced`.
- `seo.primaryKeyword`: the page's primary/Owner keyword phrase.
- `seo.searchIntent`: the specific search problem or intent owned by the page.
- `seo.keywordRole`: one of `owner` or `supporting`.

The sidecars do not change article freshness, body content, canonical URLs, or public rendering. They only supply migration metadata until each article next receives a substantive content revision. `src/generated/knowledge-article-registry.json` is generated build output and is not an editorial Source of Truth.
