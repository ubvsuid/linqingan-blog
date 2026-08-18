# Knowledge metadata migration bridge

This directory is a temporary compatibility layer for articles migrated to the Knowledge Registry without rewriting their Markdown files solely to move metadata.

Runtime rules:

- New or substantively edited articles should declare `knowledge` and `seo` together in Markdown frontmatter.
- A published article may use either inline frontmatter or one migration sidecar, never both.
- Once an article receives inline `knowledge`/`seo`, delete its sidecar in the same change.
- `npm run knowledgecheck` enforces the single-source rule and the Spawn pilot parity contract.

The sidecars do not change article freshness, body content, canonical URLs, or public rendering. They only supply migration metadata until each article next receives a substantive content revision.
