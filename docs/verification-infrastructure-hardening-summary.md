# Verification Infrastructure Hardening

This phase hardens the existing Phase 3A verification-evidence pipeline without adding fabricated runtime evidence.

## Implemented

- deterministic stable `evidence_key` identities;
- database-level duplicate protection migration;
- lifecycle states: `captured`, `reviewed`, `accepted`, `rejected`, `revoked`;
- review / acceptance / revocation metadata;
- controlled `capture:CAP-...` source-reference convention;
- maintenance CLI for write, list, show, accept, reject, revoke, report, and health checks;
- accepted-only public database reads;
- Markdown verification frontmatter remains the final public acceptance boundary;
- article runtime Evidence Card for Chinese and English guides;
- stable Evidence Keys in `/verified` and `/en/verified` summaries;
- lightweight API / Error / Tool relationships from accepted evidence;
- smoke coverage for identity, capture references, lifecycle schema, public-read boundary, CLI syntax, and no public write API.

## Explicitly not implemented

- no public Evidence write API;
- no login/admin dashboard;
- no Redis/vector database;
- no automatic Screeps runtime certification;
- no fabricated Console or live evidence;
- no complex Knowledge Graph schema yet;
- no homepage, canonical URL, or SEO route changes.

## Database rollout

`drizzle/0001_verification_evidence_governance.sql` must be verified on a Neon temporary branch before applying to the main database. Application deployment may safely precede the database migration because public evidence reads fall back to the existing Markdown verification states when the new evidence query cannot be served.
