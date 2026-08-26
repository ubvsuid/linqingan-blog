# Roadmap metadata and Content Identity

This directory stores migration sidecars for existing article learning-roadmap metadata. The permanent identity for Beginner articles is stored separately in `content/roadmap-identities.json`.

The shared field contract for article frontmatter, `knowledge`, `roadmap`, `seo`, and `verification` is governed by `docs/content-metadata-schema-v1.md`. This README documents Beginner-specific ownership and migration behavior only; it must not redefine the shared schema independently.

For the Beginner Roadmap, roadmap metadata declares:

- `roadmap.id`: roadmap identifier, currently `beginner`
- `roadmap.stage`: stable stage slug
- `roadmap.order`: global learning order within the roadmap
- `roadmap.difficulty`: learning difficulty
- `seo.primaryKeyword`: the page's Owner keyword
- `seo.searchIntent`: the page's distinct search intent
- `seo.keywordRole`: `owner` or `supporting`

## Content Identity V1

Every published Beginner article must have exactly one record in `content/roadmap-identities.json`:

```json
{
  "slug": "screeps-introduction",
  "contentId": "article_<uuid>",
  "contentGroupId": "group_<uuid>"
}
```

Identity rules:

- `contentId` is the immutable identity of this concrete language article.
- `contentGroupId` is the immutable identity of the underlying knowledge concept and is reserved for future verified language pairing.
- `slug` is only the current locator. A slug rename updates the locator but must preserve both IDs.
- IDs are never regenerated because a title, URL, category, roadmap stage, SEO field, or article body changes.
- `roadmapgenerate` validates Content Metadata Schema V1 and attaches the IDs to the generated Beginner registry.
- `roadmapcheck` rejects missing, malformed, duplicate, orphaned, or mismatched Beginner identities and also checks global ID collisions against Knowledge articles.

Existing migrated articles may keep a JSON sidecar so metadata migration does not create artificial article freshness changes. New Beginner articles, or existing articles receiving a substantive editorial update, may declare the same `roadmap` + `seo` objects directly in frontmatter instead.

A page must never declare both frontmatter roadmap metadata and a migration sidecar. When moving an existing page to frontmatter, delete its sidecar in the same change so there remains exactly one editorial Source of Truth.

Generated files under `src/generated/` are derived build output. Public article URLs, titles, content freshness, and local progress storage are not changed merely by roadmap metadata or identity attachment.
