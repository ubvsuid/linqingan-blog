# Verification Evidence Workflow

Phase 3A keeps runtime evidence separate from ordinary article metadata while preserving Markdown as the content source of truth.

## Trust boundary

- There is no public verification-evidence write API.
- Runtime evidence is written only through the repository maintenance CLI.
- `/verified` and `/en/verified` are read-only consumers.
- Database failure must not remove existing Markdown-based verification states from public pages.
- Offline simulation, documentation review, or generated fixtures must never be inserted as Console or live evidence.
- `source_ref` is an internal trace reference and is not rendered on public pages.
- Raw `before_state` and `after_state` are retained for maintenance but are not rendered publicly by the verified-page data layer.

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
- internal `sourceRef`
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
  "sourceRef": "REPLACE_WITH_INTERNAL_CAPTURE_REFERENCE",
  "verifiedAt": "REPLACE_WITH_REAL_ISO_TIMESTAMP"
}
```

The template intentionally fails validation until real observations replace the placeholders.

## Safe write sequence

Validate first; this does not need `DATABASE_URL` and does not write anything:

```bash
node scripts/verification-evidence-write.mjs path/to/evidence.json
```

After reviewing the normalized preview, commit the exact same file using an environment that has the intended Neon `DATABASE_URL`:

```bash
node scripts/verification-evidence-write.mjs path/to/evidence.json --commit
```

The writer checks that the article exists, validates bounded fields, and skips an evidence record when the same article/type/API/source/tick identity already exists.

## Read-only report

```bash
node scripts/verification-evidence-report.mjs
```

The report shows total evidence rows, verified-article counts, Console/live counts, and the latest evidence identities. It does not expose raw before/after state.

## Public rendering

`/verified` and `/en/verified` merge two sources:

1. Markdown `verification.consoleTested` / `verification.liveTested` fields.
2. Structured rows from `verification_evidence`.

The structured evidence layer can promote an article into the verified list without editing a second hand-maintained list. Public output exposes only bounded summary fields such as evidence type, date, environment, API surface, return code, Game.time/tick range, and evidence note.

The pages use a five-minute ISR window. If Neon is missing or temporarily unavailable, the public pages fall back to Markdown verification fields instead of failing.

## First live-evidence backlog

Do not fabricate these records. Capture them from real Screeps runtime observations before importing:

1. `ERR_NOT_IN_RANGE`
2. `moveTo()`
3. `spawnCreep()`
4. Controller Link / Upgrader flow
5. `Game.cpu` / bucket behavior
