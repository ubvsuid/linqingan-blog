# Evidence Model V1

Evidence Model V1 unifies the evidence semantics that already exist across article frontmatter, the Evidence Capture Kit, the `verification_evidence` table, maintenance CLIs, and public verified pages.

## 1. Two independent axes

Evidence strength and evidence lifecycle are different things.

Public strength remains:

`docs → offline → console → live`

- **docs** — `verification.docsChecked=true` means documented claims were checked against sources. It is not runtime Evidence.
- **offline** — `verification.syntaxChecked=true` is the minimum offline claim. Deterministic simulations may strengthen an offline result, but offline evidence must never be described as Screeps runtime verification.
- **console** — structured runtime Evidence with a controlled capture reference and `Game.time`.
- **live** — structured multi-tick runtime Evidence with `tickStart < tickEnd`.

Structured runtime Evidence lifecycle remains:

`captured / reviewed / accepted / rejected / revoked`

Only `accepted` rows are eligible for the public database view. Rejected and revoked records stay internal as audit history.

## 2. Permanent content ownership

`contentId` is the canonical owner of structured Evidence.

`contentGroupId` is the durable grouping key.

**articleSlug is a locator**, not an identity. A slug may change; the Content Identity must not.

Evidence key identity version 2 hashes the permanent `contentId` plus the runtime observation identity. It deliberately does not hash `articleSlug`. Existing rows keep their historical key and are marked identity version 1; new captures use identity version 2.

This means a **slug rename** must:

1. keep the same `contentId` and `contentGroupId`;
2. rename the article and update the Content Identity registry locator;
3. update `verification_evidence.article_slug` to the new locator;
4. never rewrite `evidence_key`, `content_id`, or `content_group_id`;
5. run `verification:evidence-health` before publishing.

## 3. Public truth boundary

For Console/live Evidence the public rule is:

**Database accepted + Markdown accepted = public runtime claim**

A database row with `status=accepted` does not automatically change an article. The corresponding article frontmatter must also explicitly set `consoleTested` or `liveTested`. This keeps a code-reviewed Markdown change in the publication path.

Conversely, Markdown must not claim `consoleTested=true` or `liveTested=true` without at least one accepted structured Evidence row for that article and level.

There is no public Evidence write API.

## 4. Capture and provenance

Capture bundles remain `linqingan-evidence-bundle/v1`. They continue to carry the current `articleSlug` because that is what an operator sees. Ingestion resolves that locator through Content Identity V1 and injects `contentId`, `contentGroupId`, and identity version 2. Callers cannot supply those durable IDs themselves.

`sourceRef` remains controlled as `capture:CAP-YYYYMMDD-LABEL`.

The Capture Kit remains read-only with respect to Screeps game actions and does not transmit evidence over the network.

## 5. Database migration

`drizzle/0004_evidence_model_v1.sql` adds durable Content Identity ownership to `verification_evidence`.

The migration backfills the currently verified legacy locators and then fails closed if any existing row cannot be mapped. It does not silently invent an ID.

After backfill:

- `identity_version`, `content_id`, and `content_group_id` are required;
- new rows default to identity version 2;
- duplicate observation identity is keyed by `content_id`, not slug;
- accepted public rows expose durable IDs in the controlled view;
- supported language/type values are database constrained.

## 6. Production migration order

Evidence Model development is tested on `gpt-work` + `gpt-work-dev` and must create zero Vercel Preview deployments.

For a future explicit Production release, use this order:

1. re-read Deployment Safety and Backup / Recovery policy;
2. create a short-lived production `recovery-checkpoint-*` from Neon `main`;
3. apply `drizzle/0004_evidence_model_v1.sql` to production `main`;
4. verify the production schema and run Evidence health checks;
5. only then squash merge the already-verified code PR to `clean-blog-v1`;
6. allow the single required Vercel Production;
7. verify HTTP 200 and runtime error/fatal logs;
8. delete the checkpoint only after the release is accepted.

Production PITR is not a routine test mechanism.
