# Verification Evidence Workflow

Phase 3 keeps runtime evidence separate from ordinary article metadata while preserving Markdown as the public content source of truth.

## Trust boundary

- There is no public verification-evidence write API.
- Runtime evidence is written only through repository maintenance CLI commands.
- `/verified`, `/en/verified`, and article Evidence Cards are read-only consumers.
- Markdown verification frontmatter remains the final public acceptance decision.
- A database row, including a database row with `status=accepted`, cannot promote an article by itself.
- Database failure must not remove existing Markdown-based verification states from public pages.
- Offline simulation, documentation review, generated fixtures, or AI-generated observations must never be inserted as Console or live evidence.
- `source_ref`, raw `before_state`, and raw `after_state` are internal maintenance data and are not rendered publicly.

## Evidence lifecycle

Every imported runtime observation begins as:

```text
captured
```

The supported internal lifecycle is:

```text
captured → reviewed → accepted
captured/reviewed → rejected
accepted → revoked
```

`reviewed` is available for maintenance workflows that want an intermediate review state. The current accept command may move a valid captured record directly to accepted while recording review metadata.

Public rendering requires both:

1. the database evidence row is `accepted`; and
2. the article Markdown has accepted the matching `consoleTested` or `liveTested` level.

## Stable evidence identity

The input JSON does not contain `evidenceKey`. The validator derives a stable key from:

- article slug
- verification type
- API/runtime surface
- capture source reference
- Game.time
- tick start
- tick end

The public-safe identity uses:

```text
EV-<20 uppercase hexadecimal characters>
```

The database also enforces duplicate protection on the underlying evidence identity, so concurrent or repeated imports cannot create duplicate rows when the governance migration is present.

## Capture provenance

Every real evidence row must point to a controlled capture:

```text
capture:CAP-YYYYMMDD-LABEL
```

Example:

```text
capture:CAP-20260811-ERR-NIR-001
```

See `docs/verification-evidence-capture-manifest.md` for the capture manifest convention. Do not commit Screeps tokens, database credentials, account secrets, or sensitive raw files into the public repository.

## Evidence levels

### `console`

Use only when a real Screeps Console observation was captured.

Required minimums:

- existing `articleSlug`
- `verificationType: "console"`
- real `gameTime`
- `apiName`
- at least one of `beforeState` / `afterState`
- concise `evidenceNote`
- controlled `sourceRef`
- real `verifiedAt`

### `live`

Use only when the behavior was observed across multiple real game ticks.

In addition to the common fields, `tickStart` and `tickEnd` are required and `tickEnd` must be greater than `tickStart`.

## Input shape

```json
{
  "articleSlug": "REPLACE_WITH_EXISTING_ARTICLE_SLUG",
  "language": "zh-CN",
  "verificationType": "console",
  "gameTime": null,
  "shard": null,
  "roomName": null,
  "apiName": "REPLACE_WITH_OBSERVED_API_OR_RUNTIME_SURFACE",
  "returnCode": null,
  "beforeState": null,
  "afterState": null,
  "tickStart": null,
  "tickEnd": null,
  "evidenceNote": "REPLACE_WITH_WHAT_WAS_ACTUALLY_OBSERVED",
  "sourceRef": "capture:CAP-YYYYMMDD-LABEL",
  "verifiedAt": "REPLACE_WITH_REAL_ISO_TIMESTAMP"
}
```

The template intentionally fails validation until real observations replace the placeholders.

## Safe write sequence

Validate and preview first:

```bash
npm run verification:evidence-write -- path/to/evidence.json
```

This is a dry run and does not need `DATABASE_URL`.

After reviewing the normalized preview and generated `EV-...` key, import the same file from an environment connected to the intended Neon database:

```bash
npm run verification:evidence-write -- path/to/evidence.json --commit
```

Imported records always start as `captured`.

## Review and acceptance

Inspect a single record:

```bash
npm run verification:evidence-show -- EV-XXXXXXXXXXXXXXXXXXXX
```

List records:

```bash
npm run verification:evidence-list
npm run verification:evidence-list -- --status=captured
npm run verification:evidence-list -- --article=screeps-err-not-in-range
```

Accept a reviewed real observation:

```bash
npm run verification:evidence-accept -- EV-XXXXXXXXXXXXXXXXXXXX
```

The default is dry-run. It previews the Markdown verification changes.

Commit the maintenance action only after review:

```bash
npm run verification:evidence-accept -- EV-XXXXXXXXXXXXXXXXXXXX --commit
```

The command marks the database evidence accepted first, then updates the local article Markdown verification block. The public site still changes only after that Markdown change is reviewed, committed to Git, and deployed.

## Rejection

Reject invalid captured evidence without deleting it:

```bash
npm run verification:evidence-reject -- EV-XXXXXXXXXXXXXXXXXXXX --reason="reason"
```

Add `--commit` after reviewing the dry run. Rejected rows remain in the internal audit trail and never appear in public readers.

## Revocation

Revoke previously accepted evidence:

```bash
npm run verification:evidence-revoke -- EV-XXXXXXXXXXXXXXXXXXXX --reason="reason"
```

Add `--commit` after reviewing the dry run. If no other accepted evidence remains for the same article and verification level, the command proposes/updates the corresponding Markdown verification flag back to false. If another accepted record remains, the public flag is left intact.

## Reports and integrity checks

Lifecycle report:

```bash
npm run verification:evidence-report
```

Integrity check:

```bash
npm run verification:evidence-health
```

The health check detects, among other problems:

- orphan evidence that points to a missing article;
- malformed capture references;
- invalid Console/live tick requirements;
- future verification timestamps;
- revoked rows without revocation metadata;
- duplicate evidence identities;
- Markdown `consoleTested/liveTested` without accepted evidence;
- accepted evidence that has not yet been accepted by Markdown.

## Public rendering

Public readers query only database rows with `status=accepted`, then apply the Markdown acceptance boundary again.

Public output exposes only bounded summary fields such as:

- stable Evidence Key;
- evidence type;
- date;
- environment;
- API/runtime surface;
- return code;
- Game.time or tick range;
- evidence note.

The raw source reference and before/after state remain internal.

`/verified` and `/en/verified` use a five-minute ISR window. Article Evidence Cards are built as part of normal article publishing; accepting evidence already generates a Markdown change that must be reviewed and deployed.

## Lightweight knowledge relations

Public Evidence Cards may link an accepted record to:

- the Screeps API quick reference;
- the Screeps error-code reference when a returned value is `ERR_*`;
- a small set of clearly related tools for known API surfaces.

This is intentionally a lightweight relation layer. Phase 3 does not introduce a complex Knowledge Graph.

## First live-evidence backlog

Do not fabricate these records. Capture them from real Screeps runtime observations before importing:

1. `ERR_NOT_IN_RANGE`
2. `moveTo()`
3. `spawnCreep()`
4. Controller Link / Upgrader flow
5. `Game.cpu` / bucket behavior
