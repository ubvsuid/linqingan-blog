# English editorial target, visual, and modules batch — 2026-07-31

## Selection boundary

This batch edits three existing English pages only:

1. `/en/blog/screeps-get-object-by-id`
2. `/en/blog/screeps-roomvisual-debug`
3. `/en/blog/screeps-require-modules`

The repository continues to use the existing 64-route English library and its existing Chinese mappings. No new article, slug, Chinese source, redirect, or source-directory file is created. No Search Console property or export was available, so selection is based on static content, search intent, official Screeps API boundaries, code, metadata, overlap, and validation review. No impressions, clicks, CTR, rankings, traffic, field Core Web Vitals, player feedback, or live server results are claimed.

URLs, Chinese mappings, and `datePublished` remain unchanged. `dateModified` is set to `2026-07-31` only for these three substantively edited pages.

## Why these pages

- **Game.getObjectById():** restoration, target selection, target invalidation, movement, and harvesting were combined into one large example. The resolver also checked stored room visibility before attempting the lookup, which is less useful for moving targets or records whose room metadata is stale.
- **RoomVisual:** the page mixed the minimum diagnostic layer with per-tick Memory summaries, target resolution, export/import persistence, and role-specific decisions.
- **Modules:** the page taught CommonJS boundaries through a complete role implementation, making the module contract harder to see than the role AI.

## Search-intent separation

- **Saved target resolution** owns validation of one persisted target reference and returns explicit `invalid-record`, `vision-unavailable`, `missing`, `wrong-type`, or `ready` states. The caller owns reselection and actions.
- **Memory basics** owns JSON-compatible durable state versus disposable heap state.
- **RoomVisual** owns current-tick, bounded visual diagnostics. It does not own task state, target invalidation, movement proof, or persistent telemetry.
- **CPU profiling** owns measured CPU deltas.
- **Modules** owns one main loop, small exports, current-tick object boundaries, disposable runtime caches, and durable state placement. It does not teach complete role behavior.

## Removed or compressed

- Removed repeated FAQ copy and FAQPage data from all three pages.
- Removed generic “Quick answer” headings and repeated debugging checklists.
- Removed action execution and automatic reselection from the saved-target resolver.
- Removed per-tick visual summary writes and export/import from the minimum RoomVisual workflow.
- Removed full harvester behavior from the module-contract example.
- Compressed repeated definitions of Memory, global reset, action return codes, and target lifecycle already covered by dedicated pages.

## Added technical value

### Saved target resolution

- Validates the persisted record before using it.
- Calls `Game.getObjectById()` before using room visibility to interpret a null result.
- Separates static-target room metadata from moving-target policies.
- Distinguishes identity validity from temporary state such as an empty Source.
- Returns explicit states without mutating Memory.
- Requires the caller to decide whether to wait, clear, reselect, or act.

### RoomVisual

- Uses a one-way pipeline: task logic → plain snapshot → selection → renderer.
- Keeps the renderer unable to change task or target state.
- Applies stable ordering, item limits, and a conservative byte margin.
- Returns a compact current-tick summary instead of writing Memory automatically.
- Separates byte size from CPU measurement.
- Keeps action return codes and later-tick position evidence outside the drawing itself.
- Treats export/import as an advanced replay feature, not the default debug path.

### Modules

- Defines four state lifetimes: stable definitions, disposable runtime cache, current-tick game objects, and durable Memory.
- Keeps exactly one `module.exports.loop`.
- Uses a small `run(creep, context)` contract and explicit role registry.
- Validates module shape once per runtime.
- Rebuilds current object collections inside the active tick.
- Demonstrates a rebuildable current-tick cache rather than a stale world snapshot.
- Isolates per-Creep runtime failures while explaining that module parse/load failures occur before the loop boundary.
- Adds circular-dependency and responsibility-boundary guidance.

## Re-audit scores before this revision

These are project-internal editorial scores under the current batch standard. They are not Google scores, ranking guarantees, certifications, or third-party assessments.

| Page | Before | Main deductions |
| --- | ---: | --- |
| /en/blog/screeps-get-object-by-id | 92 | Restoration mixed with reselection and actions, visibility checked too early, moving-target boundary underdeveloped |
| /en/blog/screeps-roomvisual-debug | 92 | Minimum visual layer buried under persistence and target logic, renderer too coupled to task data |
| /en/blog/screeps-require-modules | 93 | Module contract buried under role AI, state lifetimes not presented as one explicit model |

## Final internal scores

| Page | Technical /24 | Intent /18 | Original /15 | English /12 | Structure /10 | Evidence /8 | SEO /8 | A11y /5 | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| /en/blog/screeps-get-object-by-id | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| /en/blog/screeps-roomvisual-debug | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| /en/blog/screeps-require-modules | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |

One technical point remains withheld because no real Screeps Console or live multi-tick execution was performed. One original-value point remains withheld because the work is focused technical editorial analysis rather than controlled original research.

## Evidence boundary

Available evidence:

- repository source and route review;
- linked official Screeps API, modules, global objects, and game-loop documentation;
- JavaScript syntax checks;
- static article, registry, metadata, TOC, internal-link, and publication-layer checks;
- existing simulation, accessibility, TypeScript, ESLint, production build, smoke, and Lighthouse infrastructure.

Still Pending:

- Screeps Console execution;
- live multi-tick verification;
- genuine Console or room screenshots;
- live visible/invisible/missing/moving target observations;
- live RoomVisual byte-size, CPU, and rendering observations;
- live module load, syntax failure, global reset, runtime cache, role routing, and exception observations.

## Validation gate

`scripts/check-english-editorial-targets-visual-modules-20260731.mjs` validates:

- exactly three existing routes and unchanged Chinese mappings;
- unchanged publication dates and exactly three scoped modification dates;
- synchronized titles, descriptions, keywords, intent, reading time, score, and discovery data;
- fixed score component thresholds and 98-point totals;
- 35 TOC anchors;
- 14 JavaScript blocks through `node --check`;
- official Screeps sources;
- removed FAQ data;
- prohibited AI-style phrases;
- explicit Console and live multi-tick Pending states;
- publication-layer and package-script integration.

Existing repository thresholds are not lowered.
