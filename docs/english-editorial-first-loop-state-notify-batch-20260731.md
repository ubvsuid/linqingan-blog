# English editorial first-loop, state, and notify batch — 2026-07-31

## Selection boundary

This batch edits three existing English pages only:

1. `/en/blog/screeps-first-room-code`
2. `/en/blog/screeps-working-state`
3. `/en/blog/screeps-game-notify`

No new article, slug, Chinese source, redirect, or source-directory page is created. URLs, Chinese mappings, and `datePublished` remain unchanged. `dateModified` is set to `2026-07-31` only for these three substantively edited pages.

No Search Console property or export was available. Selection is based on static repository content, search intent, official Screeps documentation, code, metadata, overlap, and current validation infrastructure. No impressions, clicks, CTR, rankings, traffic, field Core Web Vitals, player feedback, live CPU improvements, or server-test results are claimed.

## Why these pages

- **First room code:** the previous page presented one large 20-minute script and repeated spawning, harvesting, upgrading, building, and repairing lessons. The integrated contract, failure states, and emergency recovery boundary were harder to see than the individual role code.
- **Working state:** the empty/full hysteresis rule was buried inside a complete harvest-and-upgrade framework, repeated action tables, debugging checklists, and FAQ copy.
- **Game.notify():** the previous producer advanced `lastSubmittedTick` when an alert entered the queue. A deferred, expired, or cancelled item could therefore start a cooldown even though `Game.notify()` was never called.

## Search-intent separation

- **First room code** owns one bounded, fixed-name teaching loop after the focused beginner lessons already work.
- **Working state** owns only the reusable empty/full Energy-phase decision. It does not own target selection or action outcomes.
- **Game.notify()** owns detected, queued, submitted, and externally delivered evidence boundaries. It does not own event interpretation or long-term telemetry.
- Focused spawn, harvest, movement, build, repair, Memory, event-log, CPU, and recovery pages retain their own narrower intents.

## Removed or compressed

- Removed all three FAQ arrays and FAQPage output.
- Removed generic Quick answer sections and repeated checklists.
- Compressed repeated API tutorials already covered by dedicated beginner pages.
- Removed the complete harvest-and-upgrade framework from the working-state article.
- Removed queue-time mutation of `lastSubmittedTick` from the notification producer.
- Removed wording that could treat accepted commands as later-tick outcomes or local notification submission as external delivery.

## Added technical value

### First room code

- Keeps one `module.exports.loop` and three fixed teaching names.
- Submits at most one Spawn request after `dryRun` validation.
- Lets existing Creeps continue if the configured Spawn name is wrong or missing.
- Uses explicit `acquire` and `work` phases with empty/full boundaries.
- Returns distinct not-found, rejected, movement-submitted, and action-submitted states.
- Uses nearest reachable active Sources and eligible work targets rather than array position zero.
- Excludes unbounded Wall and Rampart repair from the beginner fallback.
- States the 200-Energy total-workforce-loss recovery boundary.
- Separates current-tick acceptance from later-tick Spawn, position, Store, and progress evidence.

### Working state

- Defines hysteresis as empty → acquire, full → work, partial → keep the previous phase.
- Uses explicit phase strings instead of an unexplained boolean.
- Provides a pure decision function for empty, full, both partial directions, initialization, and invalid capacity.
- Writes Memory only when the phase changes.
- Keeps branch selection separate from target validation, action return codes, and later outcomes.
- Explains roles that should not use full-trip Energy hysteresis.

### Game.notify()

- Separates risk detection, queue insertion, API submission, and external delivery.
- Preserves `lastSubmittedTick` in the producer.
- Uses a keyed queue to deduplicate producers and preserve original creation and expiry ticks.
- Cancels pending alerts when a risk recovers.
- Validates, expires, prioritizes, and selects no more than 20 items.
- Updates `lastSubmittedTick` only after the code reaches `Game.notify()`.
- Leaves deferred items queued and removes expired items without false submission history.
- Keeps `groupInterval` minutes separate from game-tick repeat policy.
- Preserves the evidence boundary that no documented delivery receipt is returned.

## Internal scores before this revision

These are project-internal editorial scores, not Google scores, ranking guarantees, certifications, or third-party assessments.

| Page | Before | Main deductions |
| --- | ---: | --- |
| `/en/blog/screeps-first-room-code` | 91 | Giant integrated example, repeated tutorials, weak failure-state and recovery boundaries |
| `/en/blog/screeps-working-state` | 92 | Core hysteresis contract buried under role behavior and repeated troubleshooting copy |
| `/en/blog/screeps-game-notify` | 91 | Queue-time submission timestamp could suppress alerts that were never submitted |

## Final internal scores

| Page | Technical /24 | Intent /18 | Original /15 | English /12 | Structure /10 | Evidence /8 | SEO /8 | A11y /5 | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/en/blog/screeps-first-room-code` | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| `/en/blog/screeps-working-state` | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| `/en/blog/screeps-game-notify` | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |

One technical point remains withheld because real Screeps Console execution and live multi-tick verification are Pending. One original-value point remains withheld because the work is focused technical editorial analysis rather than controlled original research.

## Evidence boundary

Available evidence:

- repository source and route review;
- official Screeps API, game-loop, global-object, scripting, debugging, and simultaneous-action documentation;
- JavaScript syntax checks;
- static article, registry, metadata, TOC, internal-link, and publication-layer checks;
- existing simulation, accessibility, TypeScript, ESLint, production build, smoke, and Lighthouse infrastructure.

Still Pending:

- Screeps Console execution;
- live multi-tick verification;
- genuine Console, room, or notification screenshots;
- live Spawn, role, Energy-phase, target, movement, and recovery observations;
- live notification queue cap, deferral, expiry, cancellation, repeat, grouping, and external delivery observations.

## Validation gate

`scripts/check-english-editorial-first-loop-state-notify-20260731.mjs` validates:

- exactly three existing routes and unchanged Chinese mappings;
- unchanged publication dates and scoped modification dates;
- synchronized titles, descriptions, keywords, intent, reading time, and discovery metadata;
- fixed score component thresholds and 98-point totals;
- 37 TOC anchors;
- 8 JavaScript code blocks through `node --check`;
- official Screeps sources;
- removed FAQ data and prohibited AI-style phrases;
- explicit Console and live multi-tick Pending states;
- the notification queued-versus-submitted correction;
- publication-layer and package-script integration.

Existing repository thresholds are not lowered.
