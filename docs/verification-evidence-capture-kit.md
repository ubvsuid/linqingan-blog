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

## Validate and import

Save the printed JSON as a local file, for example `evidence.json`.

Dry-run validation:

```bash
npm run verification:evidence-validate -- evidence.json
```

Import as internal `captured` evidence only after the dry run is clean:

```bash
npm run verification:evidence-write -- evidence.json --commit
```

Then use the existing lifecycle commands:

```bash
npm run verification:evidence-review -- EV-... --note="what was checked" --commit
npm run verification:evidence-accept -- EV-... --note="why this evidence is sufficient" --commit
```

Acceptance never bypasses the Markdown/public verification boundary.

## First P0 targets

Phase 6B should use the kit for a small pilot rather than broad collection:

1. `Creep.moveTo()` / Creep not moving, with later-tick position and fatigue.
2. `StructureSpawn.spawnCreep()`, including `dryRun`, one real return code, and scoped state.
3. Controller + fixed Upgrader + supply Link as one multi-tick chain.
4. `ERR_NOT_IN_RANGE` as a controlled failure → corrected range → later success sequence.
5. `Game.cpu.getUsed()` + bucket across multiple ticks.

Do not expand a single observation beyond what its recorded state and tick window actually prove.
