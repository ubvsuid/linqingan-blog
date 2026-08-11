# Verification Infrastructure Hardening Rollout

Apply this phase in two independent gates:

1. **Application gate** — PR CI, Preview, and smoke tests must pass with no real evidence inserted.
2. **Database gate** — verify `drizzle/0001_verification_evidence_governance.sql` on a Neon temporary branch, then request explicit approval before applying it to the main database.

Do not import real Screeps Console/live evidence until both gates are complete.
