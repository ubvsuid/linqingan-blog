# English editorial batch: energy control and source assignment

Date: 2026-08-03  
Branch: `content/english-editorial-energy-control-20260803`  
Base: `clean-blog-v1` at `3033a678202a775f21cc6a36fb86756182fbc2f4`

## Access and evidence boundary

This batch was selected from a static repository audit. No Google Search Console property was available, so no impressions, clicks, CTR, query cannibalization, or positions are claimed. No Screeps account, live room, Console history, shard telemetry, or genuine screenshots were available. No production Vercel deployment is claimed in this branch.

Evidence used:

- repository source, metadata registries, route code, and existing smoke checks;
- current Screeps API documentation for `upgradeController()`, `StructureController`, `StructureLink.transferEnergy()`, `PathFinder.search()`, `Creep.harvest()`, and room event objects;
- JavaScript syntax checks on every visible example;
- static review of current-tick intent submission, next-tick event matching, missed verification windows, and object identity;
- Google Search Central guidance on people-first content, scaled or generated content, spam policies, SEO fundamentals, and Article structured data.

Pending evidence remains visible in every selected article:

- Screeps Console test: Pending
- Live multi-tick verification: Pending
- Genuine room or Console screenshots: Pending

## Complete existing English article inventory

The static inventory contains **64 existing English article routes**. This batch creates no article route and changes no slug.

### Getting Started and foundation

- `/en/blog/screeps-introduction`
- `/en/blog/screeps-first-room`
- `/en/blog/screeps-tick-game-loop`
- `/en/blog/screeps-creep-harvest-energy`
- `/en/blog/screeps-transfer-energy-to-spawn`
- `/en/blog/screeps-creep-body-parts`
- `/en/blog/screeps-spawn-creep`
- `/en/blog/screeps-creep-roles`
- `/en/blog/screeps-upgrade-controller`
- `/en/blog/screeps-first-extension`
- `/en/blog/screeps-build-repair`
- `/en/blog/screeps-first-room-code`
- `/en/blog/screeps-remove-construction-site`
- `/en/blog/screeps-memory-basics`
- `/en/blog/screeps-withdraw-container-energy`
- `/en/blog/screeps-pickup-dropped-energy`

### Memory, state, and modules

- `/en/blog/screeps-working-state`
- `/en/blog/screeps-get-object-by-id`
- `/en/blog/screeps-clean-dead-creep-memory`
- `/en/blog/screeps-global-cache`
- `/en/blog/screeps-rawmemory-segments`
- `/en/blog/screeps-flags-configuration`
- `/en/blog/screeps-require-modules`

### Spawn and lifecycle

- `/en/blog/screeps-spawncreep-return-codes`
- `/en/blog/screeps-dynamic-creep-body`
- `/en/blog/screeps-emergency-harvester-recovery`
- `/en/blog/screeps-renew-creep`
- `/en/blog/screeps-recycle-creep`

### Movement and pathfinding

- `/en/blog/screeps-err-not-in-range`
- `/en/blog/screeps-moveto-not-moving`
- `/en/blog/screeps-err-no-path`
- `/en/blog/screeps-move-fatigue-body-ratio`
- `/en/blog/screeps-roomposition-distance`
- `/en/blog/screeps-map-find-route`
- `/en/blog/screeps-room-visibility`
- `/en/blog/screeps-observer-observe-room`
- `/en/blog/screeps-pathfinder-costmatrix`

### Energy, Links, and Source assignment

- `/en/blog/screeps-storage-energy-usage`
- `/en/blog/screeps-link-transfer-energy` **(selected in this batch)**
- `/en/blog/screeps-select-source-by-path` **(selected in this batch)**

### Controllers

- `/en/blog/screeps-controller-activate-safe-mode`
- `/en/blog/screeps-controller-downgrade` **(selected in this batch)**
- `/en/blog/screeps-reserve-vs-claim-controller`

### Defense and construction

- `/en/blog/screeps-tower-auto-attack-hostiles`
- `/en/blog/screeps-tower-heal-creeps`
- `/en/blog/screeps-tower-repair-threshold`
- `/en/blog/screeps-room-create-construction-site`
- `/en/blog/screeps-construction-site-progress`
- `/en/blog/screeps-structure-destroy`
- `/en/blog/screeps-nuker-launch`
- `/en/blog/screeps-rampart-set-public`
- `/en/blog/screeps-wall-rampart-repair-limit`

### Market and resources

- `/en/blog/screeps-market-create-order`
- `/en/blog/screeps-market-deal`
- `/en/blog/screeps-terminal-send-resources`
- `/en/blog/screeps-lab-run-reaction`
- `/en/blog/screeps-lab-boost-creep`
- `/en/blog/screeps-factory-produce`
- `/en/blog/screeps-mineral-extractor-harvest`
- `/en/blog/screeps-power-spawn-process-power`

### CPU and observability

- `/en/blog/screeps-cpu-getused-bucket`
- `/en/blog/screeps-game-notify`
- `/en/blog/screeps-room-event-log`
- `/en/blog/screeps-roomvisual-debug`

## Selection decision

| Article | Static-audit reason | Main problem before editing | Expected improvement |
|---|---|---|---|
| `/en/blog/screeps-controller-downgrade` | High-value room survival problem; Controller and debugging intent | Hysteresis existed, but the workflow did not preflight `upgradeBlocked` or prove that one accepted Upgrader intent produced the next-tick event | Separate decision, submission, and settlement; exact actor verification; explicit blocked state and missed-window failure |
| `/en/blog/screeps-link-transfer-energy` | Core Energy logistics; multiple callers can race shared target capacity | Source IDs and cooldown were checked, but shared target capacity was only a warning and net Store changes could not identify one transfer | One dispatcher, same-tick capacity reservations, duplicate-source rejection, exact source-target event matching |
| `/en/blog/screeps-select-source-by-path` | Frequent harvesting and pathfinding problem | An empty `findPathTo()` result was overloaded; partial paths lacked an explicit completion boundary; a no-capacity role could be mislabeled as full | Fixed/dynamic assignment contracts, `PathFinder.search().incomplete` rejection, deterministic complete-path ranking, exact harvest-event verification |

No URL, slug, Canonical, hreflang mapping, Chinese source path, or `datePublished` value is changed. `dateModified` is set to `2026-08-03` because all three visible pages receive substantive technical and editorial changes.

## Intent-overlap review

### Controller downgrade versus beginner upgrading

The beginner page `/en/blog/screeps-upgrade-controller` teaches a first harvest-and-upgrade loop. The selected page now serves a narrower operational intent: entering emergency recovery, rejecting an impossible request, submitting one identifiable action, and verifying that actor in the next tick's event log.

### Link transfer versus Storage policy

`/en/blog/screeps-storage-energy-usage` decides whether room Energy can be spent. The selected Link page coordinates multiple same-room senders after that policy decision. It does not duplicate budget policy.

### Source selection versus `ERR_NO_PATH`

`/en/blog/screeps-err-no-path` diagnoses one failed search or movement request. The selected Source page compares several candidate Sources and keeps one stable assignment. It links to the path diagnostic when a known target remains unreachable.

No high-overlap page merge or redirect is required.

## Editorial changes

### Controller downgrade recovery

Removed:

- repeated quick-answer, checklist, and FAQ text that restated the same threshold advice;
- unqualified reliance on net `ticksToDowngrade` or progress as proof of one Creep's action;
- a return-code explanation that treated every `ERR_INVALID_TARGET` as a generic invalid object.

Added:

- room-specific hysteresis with invalid-threshold handling;
- owned Controller, `upgradeBlocked`, active `WORK`, active `CARRY`, Energy, and spawning preflight;
- deterministic Upgrader selection;
- separate movement and upgrade statuses;
- one pending record per accepted API call;
- exact next-tick `EVENT_UPGRADE_CONTROLLER` matching by actor and Controller context;
- explicit `verification-window-missed`, missing-event, and ambiguous-event outcomes;
- net timer and progress retained as context rather than exclusive attribution;
- internal links that separate beginner upgrading, Link supply, and Safe Mode.

### Link transfer coordination

Removed:

- repeated explanation of IDs, cooldown, and capacity in FAQ form;
- Store-delta verification that could be confused by other logistics in the same tick;
- advice that mentioned concurrency without providing a coordinating implementation.

Added:

- explicit same-room owned-Link resolution by ID;
- a single dispatcher with a same-tick run guard;
- priority ordering, duplicate-source suppression, minimum send, target reserve, and shared target-capacity reservations;
- conservative receipt estimation using `LINK_LOSS_RATIO`;
- one pending record for every accepted source-target request;
- exact next-tick `EVENT_TRANSFER` matching by source `objectId`, target ID, and Energy type;
- event-reported amount and net Stores kept as separate evidence;
- clear statement that a reservation is a local planning rule, not a server lock.

### Source selection and stable assignments

Removed:

- the assumption that an empty path array alone proves no path;
- repeated candidate-selection advice that did not expose partial searches;
- the ambiguous `creep-full` result for a role with no Energy capacity;
- implicit deletion of a saved ID when room visibility was unavailable.

Added:

- separate fixed and dynamic Source assignment contracts;
- visible-room and unavailable-vision states before clearing an ID;
- a static CostMatrix using roads, passable ramparts, and `OBSTACLE_OBJECT_TYPES`;
- `PathFinder.search()` with a hard requirement that `incomplete !== true`;
- candidate ranking by complete path length, other declared assignments, path cost, and stable Source ID;
- exclusion of the current Creep from stale assignment counts;
- path search only during reassignment, not every successful harvest tick;
- a specific `no-energy-capacity-for-this-role` boundary;
- exact next-tick `EVENT_HARVEST` matching by Creep and Source;
- separate links for known-target path failure, accepted movement with no later progress, and null object lookup.

## Human editorial pass

All three pages were reviewed after technical restructuring. The pass removed generic openings, marketing language, redundant summaries, mechanical FAQ sections, and repeated three-item templates. Sentences were shortened where conditions and results could be stated directly. Search phrases were not repeated in every heading.

The following phrases are absent from the final copy:

- “In today's fast-paced world”
- “In this comprehensive guide”
- “Whether you are a beginner or an expert”
- “Let's dive in”
- “Delve into”
- “Unlock the power of”
- “Seamlessly”
- “Robust”
- “Game-changing”
- “It is important to note that”
- “By following these steps”

## Quality scoring

Scores are internal editorial scores, not Google scores, ranking predictions, or third-party certifications.

### Before editing

| Article | Technical /24 | Intent /18 | Original /15 | English /12 | Structure /10 | Evidence /8 | SEO /8 | Accessibility /5 | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Controller downgrade | 21 | 17 | 13 | 11 | 9 | 6 | 8 | 5 | **90** |
| Link transfer | 21 | 17 | 14 | 11 | 9 | 6 | 8 | 5 | **91** |
| Source selection | 20 | 16 | 13 | 11 | 9 | 7 | 8 | 5 | **89** |

### Final static score

| Article | Technical /24 | Intent /18 | Original /15 | English /12 | Structure /10 | Evidence /8 | SEO /8 | Accessibility /5 | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Controller downgrade | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| Link transfer | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| Source selection | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |

### Score rationale and file evidence

- **Technical accuracy and code safety — 23/24:** API preconditions, return-code boundaries, one-tick event windows, actor/target identity, same-tick duplicate guards, conservative Link reservations, and incomplete-path rejection are visible in `src/lib/english-editorial-energy-control-20260803.ts`. One point remains withheld because live server behavior has not been observed.
- **Search intent — 18/18:** each page states when to use it and when another existing guide is the correct destination; the overlap review above records the boundary.
- **Original value — 14/15:** each page adds an executable operational workflow beyond API restatement. One point remains withheld because no real room case study or measured outcome exists.
- **English quality — 12/12:** the human editorial pass removes generic and repeated language while preserving engineering tone.
- **Structure — 10/10:** Controller uses a recovery/verification sequence, Link uses a planning/dispatch sequence, and Source uses assignment/path selection; they do not share one forced template.
- **Evidence transparency — 8/8:** validation levels and all missing live evidence are visible on-page.
- **SEO — 8/8:** unique Title, Description, intent, stable URL, synchronized modified date, natural internal links, and no unsupported FAQ schema.
- **Accessibility and page specification — 5/5:** the existing semantic article renderer, headings, tables, code blocks, Canonical, hreflang, author, and BlogPosting output remain in use.

## Publication gate

The content score permits publication only after repository checks pass. The branch must not be merged while TypeScript, ESLint, build, smoke, structured-data, accessibility, link, or performance gates fail.

The pending Screeps Console and live multi-tick evidence do **not** get rewritten as completed tests. They remain an evidence limitation, not a fabricated blocker removal.

## Files changed by this batch

- `src/lib/english-editorial-energy-control-20260803.ts`
- `src/lib/english-editorial-published-20260731.ts`
- `src/lib/english-articles-complete.ts`
- `scripts/smoke-english-controller-14.mjs`
- `scripts/smoke-english-link-source-18.mjs`
- `docs/english-editorial-energy-control-20260803.md`

## Official references reviewed

- https://docs.screeps.com/api/#StructureController
- https://docs.screeps.com/api/#Creep.upgradeController
- https://docs.screeps.com/api/#StructureLink.transferEnergy
- https://docs.screeps.com/api/#PathFinder.search
- https://docs.screeps.com/api/#Creep.harvest
- https://docs.screeps.com/api/#Room.getEventLog
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- https://developers.google.com/search/docs/appearance/structured-data/article

## Recommended next batch

1. `/en/blog/screeps-emergency-harvester-recovery` — verify failed-spawn and room-bootstrap recovery across ticks.
2. `/en/blog/screeps-dynamic-creep-body` — make Energy availability, body caps, and replacement timing explicit.
3. `/en/blog/screeps-storage-energy-usage` — separate reserves, operational spending, and emergency priority.
4. `/en/blog/screeps-pathfinder-costmatrix` — audit obstacle policy, cache invalidation, room callbacks, and incomplete searches.
5. `/en/blog/screeps-construction-site-progress` — distinguish accepted build intents, event evidence, and net progress changes.
