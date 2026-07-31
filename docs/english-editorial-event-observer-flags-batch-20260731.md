# English editorial event, Observer, and Flag batch — 2026-07-31

## Selection boundary

This batch edits three existing English pages only:

1. `/en/blog/screeps-room-event-log`
2. `/en/blog/screeps-observer-observe-room`
3. `/en/blog/screeps-flags-configuration`

No new article, slug, Chinese source, redirect, or source-directory page is created. URLs, Chinese mappings, author paths, and `datePublished` remain unchanged. `dateModified` is set to `2026-07-31` only for these three substantively edited pages.

No Search Console property or export was available. Selection is based on repository review, search intent, official Screeps documentation, current code examples, overlap with recently improved pages, metadata, and validation infrastructure. This batch does not claim impressions, clicks, CTR, rankings, traffic, field Core Web Vitals, player feedback, live CPU gains, or server-test results.

## Why these pages

- **Room event log:** the previous guide could append the same previous-tick events more than once when multiple modules called the reader in one tick. It also mixed raw parsing, many event schemas, ownership snapshots, action logging, aggregation, and FAQ material before establishing an idempotent ingestion boundary.
- **Observer:** the previous guide tracked each accepted request but did not center the same-tick overwrite hazard. Screeps contributed documentation warns that a later `observeRoom()` call on the same Observer can replace an earlier accepted call, so per-module `OK` logs can disagree with the request that actually executes.
- **Flags:** the previous resolver accepted any visible Source ID without proving that the Source belonged to the named Flag's room. A valid ID copied from another room could therefore produce internally inconsistent mission configuration. Its fallback also ran automatically after a configured ID failed.

## Search-intent separation

- **Room event log** owns ingestion of one visible Room's previous-tick event window exactly once, with bounded persistence and confidence-aware enrichment.
- **Observer** owns coordination of multiple vision producers into one final `observeRoom()` call per Observer and tick.
- **Flags** owns the policy that a named Flag, its Memory schema, expected object type, and target room must agree.
- The saved-target article remains the general object-ID restoration guide.
- The room-visibility article remains the guide for missing `Game.rooms` entries.
- The notification article remains responsible for alert queueing and submission.
- RoomVisual remains responsible for current-tick drawings.

## Removed or compressed

- Removed all three FAQ arrays and FAQPage output.
- Removed generic Quick answer sections and repeated debugging checklists.
- Removed the raw JSON parser from the minimum event-log workflow.
- Removed automatic fallback after a configured Flag target fails.
- Removed queue-index examples from the Observer minimum workflow.
- Compressed repeated Memory and object-restoration explanations already covered by dedicated pages.
- Removed wording that could treat current command acceptance as previous-tick event proof or current visibility as exclusive Observer proof.

## Added technical value

### Room.getEventLog()

- Labels the read tick and event tick separately.
- Gives each Room one ingestion state.
- Creates a local event key from room, previous tick, and array index.
- Normalizes only supported event shapes.
- Includes owned Power Creeps in the target snapshot.
- Preserves actor and target IDs when current objects disappear.
- Stores one replaceable window keyed by event tick instead of appending duplicates.
- Keeps only 20 windows as an explicit project retention policy.
- Derives retained summaries instead of maintaining a second counter that can drift.
- Returns visible `room-not-visible`, `already-processed`, `event-log-not-array`, and `processed` states.
- Keeps current command results separate.

### StructureObserver.observeRoom()

- Treats producer requests as planning data, not game commands.
- Deduplicates room requests and chooses one target by priority and stable room-name order.
- Reads the previous accepted request before storing a new one.
- Makes one final API call per Observer.
- Writes `Memory.observerState` only after the final call returns `OK`.
- Requires the plan's Observer ID and tick to match the submitted Observer.
- Separates `queued-in-plan`, `no-request`, `plan-mismatch`, `rejected`, and `submitted`.
- States that a room requested last tick and visible now does not prove exclusive Observer causation.
- Keeps base-range diagnostics separate from the actual method return code.
- Adds the same-tick Observer overwrite warning from Screeps contributed documentation without claiming a new live experiment.

### Flag configuration

- Adds an explicit schema version, allowed modes, and fallback policy.
- Rejects empty or invalid target IDs.
- Fails closed when fallback configuration is missing.
- Validates current object type.
- Requires the resolved object's room to match `flag.pos.roomName`.
- Distinguishes missing vision, missing target in a visible room, wrong type, and wrong room.
- Allows nearest-Source fallback only when no target ID is configured and the policy explicitly enables it.
- Blocks fallback when a reviewed target ID becomes stale or inconsistent.
- Does not rewrite `flag.memory.sourceId` after fallback.
- Writes a separate configuration diagnostic only when its signature changes.

## Internal scores before this revision

These are project-internal editorial scores, not Google scores, ranking guarantees, certifications, or third-party assessments.

| Page | Before | Main deductions |
| --- | ---: | --- |
| `/en/blog/screeps-room-event-log` | 92 | Duplicate persistence risk, too many secondary workflows before an idempotent reader |
| `/en/blog/screeps-observer-observe-room` | 92 | Same-tick overwrite hazard not central, accepted producer calls could be confused with the final request |
| `/en/blog/screeps-flags-configuration` | 91 | Valid IDs were not bound to the Flag room; automatic fallback could hide drift |

## Final internal scores

| Page | Technical /24 | Intent /18 | Original /15 | English /12 | Structure /10 | Evidence /8 | SEO /8 | A11y /5 | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/en/blog/screeps-room-event-log` | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| `/en/blog/screeps-observer-observe-room` | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| `/en/blog/screeps-flags-configuration` | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |

One technical point remains withheld because real Screeps Console execution and live multi-tick verification are Pending. One original-value point remains withheld because this is focused technical editorial analysis rather than controlled original research.

## Evidence boundary

Available evidence:

- current repository source, route, metadata, and overlap review;
- official Screeps API documentation for `Room.getEventLog()`, `Game.flags`, `Flag`, `Game.getObjectById()`, `StructureObserver.observeRoom()`, `Game.rooms`, and `OPERATE_OBSERVER`;
- Screeps contributed documentation for repeated same-tick Observer calls;
- JavaScript syntax checks;
- static article, registry, TOC, link, publication-layer, and score checks;
- existing repository content, mapping, discovery, evidence, accessibility, TypeScript, ESLint, build, smoke, and Lighthouse infrastructure.

Still Pending:

- Screeps Console execution;
- live multi-tick verification;
- genuine Console, room, Flag, or Observer screenshots;
- live duplicate event-reader calls and event-window replacement;
- live vanished Creep, Power Creep, and structure target events;
- live same-tick Observer overwrite behavior;
- live final-call coordination with multiple request producers and multiple Observers;
- live Flag rename, removal, wrong-room ID, stale ID, invisible room, and explicit fallback behavior.

## Validation gate

`scripts/check-english-editorial-event-observer-flags-20260731.mjs` validates:

- exactly three existing routes and unchanged Chinese mappings;
- unchanged publication dates and scoped modification dates;
- synchronized titles, descriptions, keywords, intent, reading time, and registry metadata;
- fixed component thresholds and 98-point totals;
- 34 TOC anchors;
- 21 JavaScript code blocks through `node --check`;
- official Screeps sources;
- removed FAQ data and prohibited AI-style phrases;
- explicit Console and live multi-tick Pending states;
- idempotent event windows;
- one final Observer submission;
- Flag target type and room binding;
- publication-layer and package-script integration.

Existing repository thresholds are not lowered.
