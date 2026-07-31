# English editorial spawn, route, and Memory batch — 2026-07-31

## Selection boundary

This batch edits three existing English pages only:

1. `/en/blog/screeps-dynamic-creep-body`
2. `/en/blog/screeps-map-find-route`
3. `/en/blog/screeps-clean-dead-creep-memory`

No new article, slug, Chinese source, redirect, or source-directory file is created. The repository remains a 64-route paired English library. URLs, Chinese mappings, and `datePublished` remain unchanged. `dateModified` is set to `2026-07-31` only for the three substantively edited pages.

No Search Console property or export was available. Selection is based on static content, search intent, Screeps API boundaries, code, metadata, overlap, and current validation infrastructure. This batch does not claim impressions, clicks, CTR, rankings, traffic, player feedback, field Core Web Vitals, live CPU gains, or server-test results.

## Why these pages

- **Dynamic Creep body:** the previous page was technically careful but centered the learning path on repeating one three-part unit. That can make “dynamic” look like “spend as much current Energy as possible,” while minimum capability, normal target body, and emergency degradation are separate policies.
- **Game.map.findRoute():** the previous page combined room policy, route calculation, stored intel, exit validation, route caching, movement, and final-room behavior in one long executor. Room-level success and current-room exit reachability were not separated early enough.
- **Dead Creep Memory:** the previous page correctly compared `Memory.creeps` with `Game.creeps`, but Creep-owned Memory, custom name indexes, shared queue references, deterministic name reuse, and death-cause evidence were too close together in one cleanup flow.

## Search-intent separation

- **Dynamic body** owns the legal body plan produced from minimum capability, current Energy, role caps, and emergency policy.
- **spawnCreep() return codes** owns rejected Spawn submissions and documented error diagnosis.
- **Emergency harvester recovery** owns the decision that a room has lost essential income and must spawn a reduced body now.
- **Game.map.findRoute()** owns the room-level next step and its conversion to one reachable exit tile.
- **ERR_NO_PATH** owns failed route and tile-search diagnosis.
- **CostMatrix** owns custom tile costs rather than room-sequence policy.
- **Dead Creep Memory** owns names confirmed absent from `Game.creeps` and explicitly documented name-index cleanup.
- **Memory basics** owns persistent-state design generally.
- **Game.getObjectById()** owns object-ID restoration and visibility boundaries.

## Removed or compressed

- Removed repeated FAQ copy and FAQPage data from all three selected pages.
- Removed generic “Quick answer” and repeated checklist sections where the workflow already answers the question.
- Removed the assumption that a dynamic body should primarily maximize complete repeated units from every partial refill.
- Removed the full stored-route executor from the first cross-room learning path.
- Removed room-name highway classification as a main safety policy example.
- Removed broad recursive Memory-cleanup implications.
- Removed the suggestion that a missing Creep name can reveal why the Creep disappeared.
- Reduced duplicated definitions and production-adjacent implementation layers.

## Added technical value

### Dynamic Creep body

- Separates minimum, target, and emergency body plans.
- Separates current `energyAvailable` from `energyCapacityAvailable` and a role cap.
- Returns an explicit `wait-or-scale` status instead of silently treating partial Energy as an emergency.
- Validates official body-part constants and derives cost from `BODYPART_COST`.
- Starts from a minimum body and appends only complete role-specific repeat units.
- Keeps the 50-part maximum and a separate maximum-Energy boundary visible.
- Reports unused Energy and expected Spawn time.
- Keeps role quotas, replacement timing, emergency detection, dryRun, and final Spawn submission outside the body builder.
- Preserves the body-order and MOVE-ratio boundary.

### Cross-room route

- Separates room plan, reachable exit tile, border transition, and destination task.
- Uses finite costs for preferences and `Infinity` only for explicit bans.
- Treats stale or missing intel as uncertainty rather than safety proof.
- Handles same-room completion before calling `findRoute()`.
- Checks for an array before reading route steps.
- Validates the first route step against `describeExits()`.
- Uses `findClosestByPath()` to answer the current-room exit-tile question.
- Stores only one explainable route step and rebuilds after the room changes.
- Requires later-tick room-name evidence for a border transition.

### Dead Creep Memory

- Separates current existence, data ownership, and death cause.
- Collects confirmed missing names before mutating Memory.
- Uses `Object.hasOwn(Game.creeps, name)` for the current-name test.
- Deletes only the Creep namespace and named indexes explicitly owned by the example.
- Keeps shared queue records, historical events, object IDs, and remote plans on separate invalidation policies.
- Returns a bounded report and keeps Console output limited.
- Runs cleanup before role counts, replacement planning, and spawning without ending the rest of the game loop.
- States that `ticksToLive === 1` is not proof that the Creep is already gone.
- Requires fresh Memory and an assignment generation when deterministic names are reused.

## Re-audit scores before this revision

These are project-internal editorial scores under the current stricter batch standard. They are not Google scores, ranking guarantees, certifications, or third-party assessments.

| Page | Before | Main deductions |
| --- | ---: | --- |
| /en/blog/screeps-dynamic-creep-body | 92 | Repeated-unit framing dominated the workflow; minimum, target, and emergency policies were not separated early enough |
| /en/blog/screeps-map-find-route | 93 | One long executor mixed route policy, intel, cache, exit reachability, movement, and destination behavior |
| /en/blog/screeps-clean-dead-creep-memory | 93 | Creep-owned state, custom indexes, shared references, name reuse, and cause evidence needed sharper boundaries |

## Final internal scores

| Page | Technical /24 | Intent /18 | Original /15 | English /12 | Structure /10 | Evidence /8 | SEO /8 | A11y /5 | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| /en/blog/screeps-dynamic-creep-body | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| /en/blog/screeps-map-find-route | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| /en/blog/screeps-clean-dead-creep-memory | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |

One technical point remains withheld because no real Screeps Console or live multi-tick execution was performed. One original-value point remains withheld because this is focused technical editorial analysis rather than original controlled research.

## Evidence boundary

Available evidence:

- repository source, route, and registry review;
- linked official Screeps API and game-loop documentation review;
- JavaScript syntax checks;
- static article, registry, metadata, TOC, internal-link, and publication-layer checks;
- existing offline simulation, production smoke, accessibility, TypeScript, ESLint, build, and Lighthouse infrastructure.

Still Pending on every selected page:

- Screeps Console test;
- live multi-tick verification;
- genuine Console or room screenshots.

Still Pending by page:

- live normal replacement and emergency dynamic-body decisions;
- live room-route calculation, exit-tile reachability, border transition, and target-room continuation;
- live Creep death, cleanup, role recount, deterministic name reuse, and fresh assignment verification.

## Validation gate

`scripts/check-english-editorial-spawn-route-memory-20260731.mjs` validates:

- exactly three existing routes and unchanged Chinese mappings;
- unchanged publication dates and exactly three scoped modification dates;
- synchronized titles, descriptions, keywords, intent, reading time, score, and discovery data;
- fixed score component thresholds and 98-point totals;
- 35 TOC anchors;
- 11 JavaScript blocks through `node --check`;
- official Screeps sources;
- removed FAQ data;
- prohibited AI-style phrases;
- explicit Console and live multi-tick Pending states;
- publication-layer and package-script integration.

Existing repository thresholds are not lowered.
