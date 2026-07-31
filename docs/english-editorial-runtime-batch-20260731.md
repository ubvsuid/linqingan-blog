# English editorial runtime batch — 2026-07-31

## Selection boundary

This batch edits three existing English pages only:

1. `/en/blog/screeps-pathfinder-costmatrix`
2. `/en/blog/screeps-global-cache`
3. `/en/blog/screeps-rawmemory-segments`

The repository still contains 64 unique paired English routes. No new article, slug, Chinese source, redirect, or source-directory file is created. No Search Console property or export was available, so selection is based on static content, intent, API, code, metadata, and overlap review. No impressions, clicks, CTR, rankings, field Core Web Vitals, player feedback, or traffic claims are used.

URLs, Chinese mappings, and `datePublished` remain unchanged. `dateModified` is set to 2026-07-31 only for the three substantively edited pages.

## Why these pages

- **CostMatrix:** the previous page mixed the static structure layer, current Creeps, cross-room callbacks, caching, movement, serialization, and general ERR_NO_PATH diagnosis in one long flow. It also treated an empty path too uniformly and used hard Creep obstacles as the main traffic example.
- **Global cache:** the previous page led quickly into a generic cache framework, cloning strategies, eviction, and performance discussion before proving the central contract: every cached value must be safe to lose and rebuild.
- **RawMemory Segments:** the previous page covered activation, reading, writing, double buffering, public Segments, foreign Segments, and multiple managers at once. The request-now/read-later lifecycle was correct but buried under too many adjacent systems.

## Search-intent separation

- **CostMatrix** owns the contents and layering of one navigation matrix: static structures, current traffic, invisible-room fallback, and incomplete search inspection.
- **ERR_NO_PATH** remains the route for diagnosing a failed movement or path search across ranges, callbacks, matrices, limits, and room routes.
- **Global cache** owns disposable derived data that can vanish on a global reset. It does not teach durable Memory or Segment storage.
- **Memory basics** owns small durable state and the local/heap/Memory mental model.
- **RawMemory Segments** owns coordinated activation and persistent string payloads across later ticks. It does not replace ordinary Memory or a disposable heap cache.

## Removed or compressed

- Removed repeated FAQ copy and FAQPage data from all three pages.
- Removed generic “Quick answer,” repeated debugging checklists, and low-value summaries where the main workflow already answered the question.
- Removed the full generic cache framework from the first learning path.
- Removed dynamic Creep positions from the cacheable static CostMatrix layer.
- Replaced the primary hard-traffic example (`255` for every other Creep) with a soft per-search traffic overlay.
- Removed double-buffer, public-Segment, and foreign-Segment implementation detail from the minimum RawMemory workflow; these remain production notes rather than the main task.
- Reduced repeated definitions and mechanical three-part sections.

## Added technical value

### CostMatrix

- Separates static structure costs from current traffic.
- Includes Roads, Containers, Portals, and owned/public Ramparts in an explicit walkability policy.
- Clones the static layer before applying soft current-Creep costs.
- Checks the requested range before searching, so an already-satisfied goal is not mislabeled as an empty-path failure.
- Separates `search.incomplete`, zero returned steps, and movement submission.
- Keeps invisible rooms on terrain-only routing with `undefined`; reserves `false` for explicit room bans.
- States that search and movement intent belong to the current tick, while position verification belongs to later ticks.

### Global cache

- Leads with the source-of-truth, rebuild, invalidation, and reset contract.
- Uses one concrete visible-room index instead of a broad generic cache library.
- Returns copied arrays to prevent callers from mutating cached values.
- Caches object IDs and resolves current game objects each tick.
- Uses an explicit persistent layout version plus a bounded age fallback.
- Adds visibility, builder failure, key growth, mutation, and reset-warmup boundaries.

### RawMemory Segments

- Leads with the official ID, active-count, size, timing, and last-call boundaries.
- Implements one priority request manager and one final activation call.
- Distinguishes unavailable, empty, invalid JSON, schema mismatch, and ready states.
- Writes only after confirming that the Segment is active.
- Measures UTF-8 bytes before the 100 KB boundary.
- Shows a minimum request/read/write workflow that commonly returns unavailable first and becomes readable on a later tick.
- Keeps deferred IDs visible instead of silently dropping them.

## Re-audit scores before this revision

These are project-internal editorial scores under the current stricter batch standard. They are not Google scores, ranking guarantees, certifications, or third-party assessments. Earlier registry scores are not reused as evidence for the new review.

| Page | Before | Main deductions |
| --- | ---: | --- |
| /en/blog/screeps-pathfinder-costmatrix | 93 | Overbroad workflow, hard traffic as the primary example, empty-path states insufficiently separated, overlap with ERR_NO_PATH |
| /en/blog/screeps-global-cache | 92 | Generic framework before the minimum task, repeated Memory explanation, excessive cloning/eviction detail, weak first-action path |
| /en/blog/screeps-rawmemory-segments | 93 | Main lifecycle buried under double-buffer/public/foreign Segment detail, repeated FAQ, too many implementation layers at once |

## Final internal scores

| Page | Technical /24 | Intent /18 | Original /15 | English /12 | Structure /10 | Evidence /8 | SEO /8 | A11y /5 | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| /en/blog/screeps-pathfinder-costmatrix | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| /en/blog/screeps-global-cache | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| /en/blog/screeps-rawmemory-segments | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |

One technical point remains withheld because no real Screeps Console or live multi-tick execution was performed. One original-value point remains withheld because the work is focused technical editorial analysis rather than original controlled research.

## Evidence boundary

Available evidence:

- repository source and route review;
- linked official Screeps API and game-loop documentation review;
- JavaScript syntax checks;
- static article, registry, metadata, TOC, internal-link, and publication-layer checks;
- existing offline simulation, production smoke, accessibility, TypeScript, ESLint, build, and Lighthouse infrastructure.

Still Pending on every selected page:

- Screeps Console test;
- live multi-tick verification;
- genuine Console or room screenshots;
- live multi-Creep CostMatrix traffic and cross-room behavior;
- live global-reset and cache invalidation behavior;
- live Segment activation, persistence, byte-limit, and multi-module coordination.

## Validation gate

`scripts/check-english-editorial-runtime-20260731.mjs` validates:

- exactly three existing routes and unchanged Chinese mappings;
- unchanged publication dates and exactly three scoped modification dates;
- synchronized titles, descriptions, keywords, intent, reading time, score, and registry discovery data;
- fixed score component thresholds and a 98-point total;
- 31 TOC anchors;
- 11 JavaScript blocks through `node --check`;
- official Screeps sources;
- removed FAQ data;
- prohibited AI-style phrases;
- explicit Console and live multi-tick Pending states;
- publication-layer and package-script integration.

Existing repository thresholds are not lowered.
