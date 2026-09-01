# Screeps Real Evidence Capture Kit

Phase 6A standardizes how Console and live multi-tick observations become reviewable Verification Evidence.

## Boundary

The Capture Kit is intentionally conservative:

- `public/screeps-evidence-capture-kit.js` does **not** call game-action methods such as movement, harvesting, spawning, upgrading, Link transfer, Market actions, destruction, or production.
- Console evidence records an action result that the operator has already produced explicitly.
- Multi-tick capture writes only to `Memory.__linqinganEvidenceCapture` so a session can survive tick boundaries.
- A generated bundle is not public evidence. It must still pass repository validation, be imported as `captured`, reviewed, and accepted. Markdown verification state remains a separate public acceptance boundary.
- Never include account tokens, cookies, credentials, private messages, or unrelated player data in evidence state.

## Bundle contract

The standard envelope is:

```json
{
  "schemaVersion": "linqingan-evidence-bundle/v1",
  "captureKitVersion": "1.0.0",
  "generatedAt": "2026-08-11T00:00:00.000Z",
  "records": []
}
```

Each record continues to use the existing Verification Evidence fields:

- `articleSlug`
- `language`
- `verificationType` (`console` or `live`)
- `gameTime`
- `shard`
- `roomName`
- `apiName`
- `returnCode`
- `beforeState`
- `afterState`
- `tickStart`
- `tickEnd`
- `evidenceNote`
- `sourceRef`
- `verifiedAt`

The existing single-record JSON and raw array formats remain supported for backward compatibility.

## Install in Screeps Console

Open `/screeps-evidence-capture-kit.js` on the site, copy the script, and paste it into the Screeps Console. It installs one global object:

```js
EvidenceCapture
```

Useful helpers:

```js
EvidenceCapture.snapshot({
  creep: Game.creeps.Upgrader1,
  controller: Game.rooms.E51S44 && Game.rooms.E51S44.controller,
});
```

The snapshot helper reads selected identity, position, Store, body, fatigue, cooldown, Controller, progress, and health fields without invoking an action.

## Console evidence

Capture `beforeState`, explicitly execute the action yourself, capture `afterState`, then pass the observed return code to the kit.

```js
var before = EvidenceCapture.snapshot({ creep: Game.creeps.Upgrader1 });
var rc = Game.creeps.Upgrader1.upgradeController(Game.rooms.E51S44.controller);
var after = EvidenceCapture.snapshot({ creep: Game.creeps.Upgrader1, controller: Game.rooms.E51S44.controller });
EvidenceCapture.captureConsole({
  articleSlug: "screeps-upgrade-controller",
  language: "zh-CN",
  roomName: "E51S44",
  apiName: "Creep.upgradeController",
  returnCode: rc,
  beforeState: before,
  afterState: after,
  evidenceNote: "One explicit Console call; this does not prove long-term Upgrader behavior.",
  label: "UPGRADE-CONTROLLER"
});
```

The action line above is deliberately outside the Capture Kit. The kit only records what you explicitly choose to execute and observe.

## Live multi-tick evidence

Start a session with a first snapshot:

```js
var session = EvidenceCapture.beginLive({
  articleSlug: "screeps-moveto-not-moving",
  language: "en",
  roomName: "E51S44",
  apiName: "Creep.moveTo",
  beforeState: EvidenceCapture.snapshot({ creep: Game.creeps.Worker1 }),
  evidenceNote: "Track later-tick position and fatigue without inferring success from one return code.",
  label: "MOVE-LIVE"
});
```

On later ticks, add read-only samples:

```js
EvidenceCapture.sampleLive(session, EvidenceCapture.snapshot({ creep: Game.creeps.Worker1 }));
```

Finish only on a later tick:

```js
EvidenceCapture.finishLive(session, {
  afterState: EvidenceCapture.snapshot({ creep: Game.creeps.Worker1 }),
  evidenceNote: "Observed multiple ticks; review the saved samples before accepting the claim."
});
```

`finishLive` prints a versioned Evidence Bundle. It does not delete the session automatically. After saving the bundle, explicitly remove it with:

```js
EvidenceCapture.clearLive(session);
```

The kit limits one live session to 30 samples to keep evidence state within the repository budget.

## Phase 1 Spawn operator path

The first Runtime Evidence expansion target is `StructureSpawn.spawnCreep()` for the still-missing Console branches `ERR_INVALID_ARGS (-10)`, naturally occurring `ERR_BUSY (-4)`, and naturally inactive `ERR_RCL_NOT_ENOUGH (-14)`.

Use the Safe Capture Recipe shown on `/verification/coverage`. Run **one branch at a time** and save each printed bundle as its own JSON file. The recipe is deliberately `dryRun: true` and fail-closed. Do not create, cancel, downgrade, unclaim, destroy, or otherwise damage colony state to manufacture Evidence.

Before any database import, run the Spawn-specific guard:

```bash
node scripts/verification-evidence-spawn-check.mjs evidence.json
```

This guard adds branch-specific checks on top of the generic Evidence schema validation. It requires:

- exactly one record per operator file;
- current owner `screeps-spawn-create-creep`;
- `verificationType=console` and `apiName=StructureSpawn.spawnCreep`;
- `beforeState.probe.dryRun === true`;
- target branch and return code agreement;
- the expected active/busy/body state for the selected recipe;
- no observed Spawn spawning-identity change across the dryRun probe;
- the explicit non-destructive room-safety note for `ERR_RCL_NOT_ENOUGH`.

A passing guard still does **not** prove that an inactive Spawn occurred naturally. The operator/reviewer must confirm that no downgrade, unclaim, destruction, or other room manipulation was performed to create that condition. If the environment does not naturally provide `ERR_BUSY` or `ERR_RCL_NOT_ENOUGH`, leave that branch Pending.

The guard never writes to Neon and never changes Evidence lifecycle status.

## Validate and import

Save the printed JSON as a local file, for example `evidence.json`.

For a Spawn Phase 1 bundle, run the Spawn-specific guard first:

```bash
node scripts/verification-evidence-spawn-check.mjs evidence.json
```

Then run the repository-wide dry-run validation:

```bash
npm run verification:evidence-validate -- evidence.json
```

Import as internal `captured` evidence only after both checks are clean and the operator has reviewed the real Console context:

```bash
npm run verification:evidence-write -- evidence.json --commit
```

Then use the existing lifecycle commands:

```bash
npm run verification:evidence-review -- EV-... --note="what was checked" --commit
npm run verification:evidence-accept -- EV-... --note="why this evidence is sufficient" --commit
```

Acceptance never bypasses the Markdown/public verification boundary. After database acceptance, the owning article's Markdown verification state must be reviewed and updated separately before the new record can become public accepted Evidence.

## First P0 targets

Phase 6B should use the kit for a small pilot rather than broad collection:

1. `Creep.moveTo()` / Creep not moving, with later-tick position and fatigue.
2. `StructureSpawn.spawnCreep()`, including `dryRun`, one real return code, and scoped state.
3. Controller + fixed Upgrader + supply Link as one multi-tick chain.
4. `ERR_NOT_IN_RANGE` as a controlled failure → corrected range → later success sequence.
5. `Game.cpu.getUsed()` + bucket across multiple ticks.

Do not expand a single observation beyond what its recorded state and tick window actually prove.
