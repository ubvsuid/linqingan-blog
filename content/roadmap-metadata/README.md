# Roadmap metadata

This directory stores migration sidecars for existing article learning-roadmap identity.

For the Beginner Roadmap, roadmap metadata declares:

- `roadmap.id`: roadmap identifier, currently `beginner`
- `roadmap.stage`: stable stage slug
- `roadmap.order`: global learning order within the roadmap
- `roadmap.difficulty`: learning difficulty
- `seo.primaryKeyword`: the page's Owner keyword
- `seo.searchIntent`: the page's distinct search intent
- `seo.keywordRole`: `owner` or `supporting`

Existing migrated articles may keep a JSON sidecar so metadata migration does not create artificial article freshness changes. New Beginner articles, or existing articles receiving a substantive editorial update, may declare the same `roadmap` + `seo` objects directly in frontmatter instead.

A page must never declare both frontmatter roadmap metadata and a migration sidecar. When moving an existing page to frontmatter, delete its sidecar in the same change so there remains exactly one editorial Source of Truth.

Generated files under `src/generated/` are derived build output. Public article URLs, titles, content freshness, and local progress storage are not changed merely by roadmap metadata.
