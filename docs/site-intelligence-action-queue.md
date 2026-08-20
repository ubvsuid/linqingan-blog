# Site Intelligence Action Queue V1

The Action Queue is the rule-based decision layer above Site Asset Master and Site Intelligence Signals. It turns normalized signals into a small, explainable operating queue without inventing a composite SEO score.

## Input boundary

The queue consumes only a `site-intelligence-signals.json` snapshot. It does not query Google Search Console, Neon, GitHub, or production routes directly.

This keeps the chain auditable:

`Source of truth -> Asset Master -> Signals -> Action Queue`

Every queued action retains its source signal IDs, source families, rationale, metrics, and sample boundary.

## Priority rules

### P0

P0 is deliberately narrow. It is reserved for explicit high-value GSC issues, including:

- Owner keyword mismatch / cannibalization;
- upstream GSC P0 CTR opportunities;
- upstream GSC P0 ranking opportunities.

Behavioral data cannot independently create P0.

### P1

Typical P1 work includes:

- GSC P1 intent or ranking work;
- mature owned internal-search zero-result problems;
- conflicting, rejected, or revoked Runtime Evidence;
- mature negative article feedback;
- mature unowned zero-result vocabulary that requires research;
- a P2 action corroborated by another mature source family.

### P2

Typical P2 work includes:

- internal-search no-click review when the sample gate is mature;
- low tool activation after a mature tool-event sample;
- pending Runtime Evidence review;
- protect-and-expand maintenance for already winning pages.

## Behavioral gates

The Action Queue does not override the Signals Layer safety gate.

Internal search, tool usage, and article feedback must already be marked `rankingEligible`. Early behavior below the operational minimum remains absent from the ranked queue.

This is an anti-overreaction rule, not a statistical-confidence claim.

## Runtime Evidence

Runtime Evidence is handled as technical proof, not popularity:

- accepted only: no maintenance action by itself;
- accepted + rejected: P1 conflict review;
- rejected only: P1 technical review;
- revoked: P1 re-verification;
- captured/reviewed without accepted evidence: P2 completion work.

Evidence work does not automatically become SEO P0.

## Corroboration

If an asset has actionable signals from two or more mature source families, a P2 recommendation may be promoted to P1.

Corroboration cannot manufacture P0. P0 must still match an explicit P0 rule.

## Unmapped observations

The queue preserves actionable unmapped observations:

- an unmapped GSC `/blog/` URL becomes an inventory/mapping review;
- a mature unowned internal-search zero-result query becomes a research task.

Neither condition automatically creates a new article or redirect.

## Generate the queue

First generate the normalized Signals snapshot. Then run:

```bash
node scripts/site-intelligence-action-queue-report.mjs \
  --signals reports/site-intelligence-signals.json \
  --json reports/site-intelligence-action-queue.json \
  --markdown reports/site-intelligence-action-queue.md \
  --limit 50
```

## V1 boundaries

This version does not:

- calculate an SEO Opportunity Score;
- calculate a User Demand Score;
- change article content;
- change titles, URLs, redirects, or canonical tags;
- write to Neon;
- publish automatically;
- create new articles from zero-result searches;
- turn a small behavior sample into priority work.

The queue is an operating recommendation system. Human review remains required before any content or architecture change.

## Vercel budget rule

Action Queue development follows the repository delivery rule already adopted for linqingan.com:

1. finish rule design and fixtures before creating a feature branch;
2. run syntax and pure-logic checks before the first push;
3. assemble one coherent commit;
4. trigger one Preview for deployment-environment verification;
5. if a failure exists, inspect all failures before making one consolidated correction.

Vercel Preview is the final environment check, not the development debugger.
