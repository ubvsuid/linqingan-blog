# English editorial batch: recovery, Storage, and construction verification

Date: 2026-08-03  
Branch: `content/english-editorial-recovery-storage-build-20260803`  
Stacked base: `content/english-editorial-energy-control-20260803` at `807e8feab4dfa4f350ec070b0daa758e48f976af`

## Access and publication boundary

This batch was selected from a static repository and pull-request history audit. No Google Search Console property was available, so no impressions, clicks, CTR, positions, or query cannibalization data are claimed.

The branch is stacked on PR #91 because that earlier PR updates the shared English publication registry and has not yet been merged into `clean-blog-v1`. This batch must not be merged before PR #91. After PR #91 merges, rebase or retarget this branch to the updated default branch and rerun all gates.

No Screeps account, live room, shard telemetry, Console history, or genuine screenshots were available. Evidence used:

- repository source, metadata registries, existing smoke checks, and prior deep-edit PR history;
- official Screeps documentation source and public API pages for `spawnCreep()`, Spawn progress, Storage, `withdraw()`, `transfer()`, `Creep.build()`, Construction Sites, `Room.getEventLog()`, and tick timing;
- JavaScript syntax checks for every visible example;
- static review of current-tick submission, exact object identity, one-tick event windows, later object recovery, and missed verification states;
- offline decision and calculation cases;
- a separate human editorial pass.

Pending evidence remains visible in each selected article:

- Screeps Console test: Pending
- Live multi-tick verification: Pending
- Genuine room or Console screenshots: Pending

## Selection decision

| Article | Static-audit reason | Main problem before editing | Expected improvement |
|---|---|---|---|
| `/en/blog/screeps-emergency-harvester-recovery` | High-value colony-collapse problem in the core Spawn path | Counted live role labels but did not treat an exact recovery Creep already being spawned as a first-class state; accepted requests were not tracked through completion | Define a capability contract, save exact Spawn/name identity after `OK`, prevent duplicates across ticks, and expose missing or overdue requests |
| `/en/blog/screeps-storage-energy-usage` | Core room Energy budget and logistics problem | Reserve math was local to one hauler and later Store deltas could not attribute one withdrawal or delivery | Use one room/tick coordinator for shared withdrawal and target capacity, then verify exact source-target `EVENT_TRANSFER` records |
| `/en/blog/screeps-construction-site-progress` | Frequent Builder monitoring and debugging problem | Reported current progress but did not connect one accepted `build()` call to the exact Builder and Site on the next tick | Keep the current-state report, add an optional tracked build workflow, and distinguish active, completed, removed, missing, ambiguous, and missed-window states |

No article route, slug, Canonical URL, hreflang pair, Chinese source path, or `datePublished` value is changed. `dateModified` is updated to `2026-08-03` only for these three substantially edited pages.

## Prior-work exclusion

The initial candidate list included `/en/blog/screeps-dynamic-creep-body` and `/en/blog/screeps-pathfinder-costmatrix`. Pull-request history showed that those pages had already received 98-point deep editorial work in earlier PRs. They were excluded to avoid repetitive optimization and unnecessary freshness changes.

## Intent-overlap review

### Emergency recovery versus body planning and return-code diagnosis

`/en/blog/screeps-dynamic-creep-body` decides what legal body a healthy economy can afford under minimum, target, and emergency budgets. The selected recovery page decides whether an owned room currently needs one emergency request, whether that exact request is already spawning, and whether the requested Creep later exists.

`/en/blog/screeps-spawncreep-return-codes` diagnoses one failed Spawn API request. The recovery page owns the room-level recovery state and links to the return-code guide when the final call is rejected.

### Storage budget versus Link coordination

`/en/blog/screeps-link-transfer-energy` coordinates Link senders and receivers after a room policy decides Energy may move through the Link network. The selected Storage page coordinates Creep withdrawals and deliveries while preserving a room-specific stock reserve. They use the same evidence principle—exact source and target identity—but serve different structures and actions.

### Construction progress versus site creation and beginner building

`/en/blog/screeps-room-create-construction-site` creates one reviewed Site. The selected page starts after a Site exists: it reports progress and optionally samples one exact Builder action. Beginner build-and-repair content remains the correct destination for a first work loop.

No merge, redirect, or Canonical consolidation is required.

## Editorial changes

### Emergency Harvester Recovery

Removed or replaced:

- role-label counting as the only definition of a useful harvester;
- a same-tick-only duplicate prevention model;
- an untracked dry-run/final-call sequence;
- generic checklist and FAQ repetition;
- a scope statement that acknowledged missing in-production detection without solving it.

Added:

- an explicit general-harvester capability contract using ownership, role, home room, spawning state, and active `WORK`, `CARRY`, and `MOVE`;
- four observable recovery states;
- exact pending fields for Spawn ID, requested Creep name, submit tick, and body length;
- next-tick and later-tick checks against `spawn.spawning.name` and `Game.creeps[name]`;
- `accepted-request-not-observed` and `recovery-overdue` outcomes;
- one final request record written only after the real `spawnCreep()` returns `OK`;
- a clear boundary for established rooms below minimum Energy;
- production notes for one central Spawn scheduler.

### Storage Energy Usage

Removed or replaced:

- per-Creep reserve calculations that could expose the same Energy to several haulers;
- Store-delta-only verification;
- a generic suggestion to consider reservations without integrating them into execution;
- repeated FAQ and checklist text.

Added:

- one per-room, per-tick coordinator;
- a shared withdrawal budget above the reserve;
- shared target-capacity reservations;
- duplicate-Creep suppression;
- movement before reservation;
- reservation release when an API call is rejected;
- exact pending records for accepted withdrawals and deliveries;
- withdrawal identity as Storage ID to Creep ID;
- delivery identity as Creep ID to target structure ID;
- next-tick `EVENT_TRANSFER` matching by source, target, and resource type;
- event amount and current Store values kept as separate evidence;
- explicit missing, ambiguous, and missed-window results.

### Construction Site Progress

Removed or replaced:

- progress reporting as the only workflow;
- an empty-list diagnostic that could not attribute one Builder;
- repeated FAQ and checklist text;
- any implication that a net progress increase proves one Creep acted.

Added:

- a stable all-site current-state report;
- a diagnostic contract for tracking one Builder action;
- ownership, spawning, active `WORK`, Energy, room, and range-3 preflight;
- one pending record written only after `build()` returns `OK`;
- exact next-tick `EVENT_BUILD` matching by Builder ID and Site ID;
- coordinate-and-type inspection after Site disappearance;
- separate states for active Site, completed structure, missing/removed Site, no matching event, multiple matching events, and missed verification window;
- a clear explanation that event identity and net progress answer different questions;
- a retained prohibition on unsupported ETA claims.

## Human editorial pass

The final pass removed generic openings, repeated quick-answer/checklist/FAQ blocks, empty conclusions, mechanical three-item phrasing, and search-keyword repetition. The three pages use different structures:

- emergency recovery uses a recovery state model;
- Storage uses budget, reservation, execution, and settlement;
- construction uses current-state reporting plus an optional attribution sample.

The following phrases are absent from the final article copy:

- “In today's fast-paced world”
- “In this comprehensive guide”
- “Whether you are a beginner or an expert”
- “Let's dive in”
- “Delve into”
- “Unlock the power of”
- “Seamlessly”
- “Game-changing”
- “It is important to note that”
- “By following these steps”

## Quality scoring

Scores are project-internal editorial scores, not Google scores, ranking predictions, or third-party certifications.

### Before editing

| Article | Technical /24 | Intent /18 | Original /15 | English /12 | Structure /10 | Evidence /8 | SEO /8 | Accessibility /5 | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Emergency recovery | 21 | 17 | 13 | 11 | 9 | 6 | 8 | 5 | **90** |
| Storage Energy | 21 | 17 | 14 | 11 | 9 | 6 | 8 | 5 | **91** |
| Construction progress | 21 | 17 | 13 | 11 | 9 | 6 | 8 | 5 | **90** |

### Final static score

| Article | Technical /24 | Intent /18 | Original /15 | English /12 | Structure /10 | Evidence /8 | SEO /8 | Accessibility /5 | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Emergency recovery | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| Storage Energy | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| Construction progress | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |

### Score rationale and file evidence

- **Technical accuracy and code safety — 23/24:** executable preconditions, final return-code recording, exact Spawn/name or event actor-target identity, one-tick windows, local reservation release, and explicit terminal states are enforced by `src/lib/english-editorial-recovery-storage-build-20260803.ts` and `scripts/check-english-editorial-recovery-storage-build-20260803.mjs`. One point remains withheld because no live server run exists.
- **Search intent — 18/18:** each page states when to use it and routes adjacent tasks to existing focused guides.
- **Original value — 14/15:** each page adds a usable operational model beyond the API reference. One point remains withheld because no real room case study or measured outcome exists.
- **English quality — 12/12:** the human editorial pass removes generic and repeated language while preserving an engineering tone.
- **Structure — 10/10:** the three pages use different structures suited to recovery, logistics coordination, and diagnostics.
- **Evidence transparency — 8/8:** all missing live evidence remains visible and Pending.
- **SEO — 8/8:** unique Title and Description, stable URL, synchronized modified date, natural internal links, and no unsupported FAQ schema.
- **Accessibility and page specification — 5/5:** the existing semantic renderer, headings, tables, code blocks, Canonical, hreflang, author, and BlogPosting output remain in use.

## Files changed by this batch

- `src/lib/english-editorial-recovery-storage-build-20260803.ts`
- `src/lib/english-editorial-published-20260731.ts`
- `src/lib/english-spawn-registry-3.ts`
- `src/lib/english-mineral-storage-power-registry-12.ts`
- `src/lib/english-construction-safety-registry-15.ts`
- `scripts/smoke-english-spawn-3.mjs`
- `scripts/smoke-english-resources-12.mjs`
- `scripts/smoke-english-construction-15.mjs`
- `scripts/check-english-editorial-recovery-storage-build-20260803.mjs`
- `package.json`
- `docs/english-editorial-recovery-storage-build-20260803.md`

## Publication gate

All repository checks must pass on the stacked PR head. The branch must not merge before PR #91, and must not merge while TypeScript, ESLint, production build, smoke, link, structured-data, accessibility, or Lighthouse gates fail.

Pending live evidence is an evidence limitation, not a reason to invent test output:

- Console execution: Pending
- live recovery request and Creep creation: Pending
- live multi-hauler Storage event sequence: Pending
- live Builder event and Site replacement: Pending
- genuine screenshots: Pending
- Search Console data: unavailable
- production Vercel verification: pending until merge

## Official references reviewed

- Screeps official API: `StructureSpawn.spawnCreep()`
- Screeps official API: `StructureSpawn.Spawning`
- Screeps official API: `Room.energyAvailable`
- Screeps official respawn documentation
- Screeps official API: `Room.storage`
- Screeps official API: `Creep.withdraw()`
- Screeps official API: `Creep.transfer()`
- Screeps official API: `ConstructionSite`
- Screeps official API: `Creep.build()`
- Screeps official API: `Room.getEventLog()`
- Screeps official game-loop documentation
- Google Search Central people-first, generated content, spam, SEO starter, and Article structured-data guidance

## Recommended next batch

1. `/en/blog/screeps-wall-rampart-repair-limit` — separate long-term defense targets, emergency repair ceilings, and exact Tower or Creep repair attribution.
2. `/en/blog/screeps-mineral-extractor-harvest` — verify exact Mineral harvest events, depletion, regeneration, and fixed-miner capacity boundaries.
3. `/en/blog/screeps-power-spawn-process-power` — bind process requests to exact next-tick Store and GPL evidence without treating net deltas as exclusive attribution.
4. `/en/blog/screeps-reserve-vs-claim-controller` — audit hostile reservation, Controller ownership transitions, and claim-capacity failure states.
5. `/en/blog/screeps-renew-creep` — distinguish accepted renewal, Spawn busy state, Boosted body cost, and later TTL change.
