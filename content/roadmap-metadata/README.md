# Roadmap metadata

This directory stores migration sidecars for article learning-roadmap identity.

For the Beginner Roadmap, each sidecar declares:

- `roadmap.id`: roadmap identifier, currently `beginner`
- `roadmap.stage`: stable stage slug
- `roadmap.order`: global learning order within the roadmap
- `roadmap.difficulty`: learning difficulty
- `seo.primaryKeyword`: the page's Owner keyword
- `seo.searchIntent`: the page's distinct search intent
- `seo.keywordRole`: `owner` or `supporting`

The sidecar is the editorial Source of Truth for roadmap membership and order. Generated files under `src/generated/` are derived build output. Public article URLs, titles, content freshness, and local progress storage are not changed by roadmap metadata.
