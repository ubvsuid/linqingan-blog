# English editorial batch — 2026-07-31

## Inventory and selection method

The authoritative inventory for this audit is `publishedEnglishArticles` in `src/lib/english-articles-complete.ts`. It combines the existing English article registries without creating new routes. The audit reviewed the complete registry structure, the dynamic English article route, the Movement batch source, recent English editorial pull requests, and the repository's existing quality scripts.

No Google Search Console property or export was available through the connected tools. Article selection is therefore based on static content, code, metadata, internal-link, and search-intent review. No impressions, clicks, rankings, CTR, user feedback, or Core Web Vitals field data are claimed.

This batch selects three existing Movement pages:

| Existing route | Why selected | Primary intent after editing |
| --- | --- | --- |
| `/en/blog/screeps-err-not-in-range` | High-frequency action failure; readers can easily confuse an action return code with a movement result. | Diagnose an action-distance failure and use the correct action range. |
| `/en/blog/screeps-moveto-not-moving` | `moveTo()` returning `OK` is often misread as proof that the Creep changed position. | Diagnose an accepted movement order with no progress across later ticks. |
| `/en/blog/screeps-err-no-path` | Path search failures overlap with traffic, stale cache, and partial PathFinder results unless the boundaries are explicit. | Diagnose a failed path search, callback, matrix, limit, or room route. |

The three pages form one troubleshooting sequence but retain separate primary intents. URLs, canonical paths, Chinese source mappings, and navigation order remain unchanged.

## Before-edit audit

### `screeps-err-not-in-range`

- Target reader: a beginner or intermediate player who has logged `ERR_NOT_IN_RANGE` from a Creep action.
- Main problem: the page was technically useful but overlong for the task, repeated its answer in the FAQ, and mixed a minimal fix with a large helper before establishing the shortest reproducible workflow.
- Risk: readers could keep moving after a non-range failure or treat `moveTo()` as if it changed `creep.pos` immediately.
- Before score: **91/100**.
  - Technical accuracy and code safety: 22/24
  - Search intent and task completion: 16/18
  - Original value and insight: 13/15
  - Natural English and editorial quality: 10/12
  - Structure and readability: 9/10
  - Evidence transparency: 8/8
  - SEO and internal links: 8/8
  - Accessibility and page standards: 5/5

### `screeps-moveto-not-moving`

- Target reader: a player whose movement call returns `OK` but whose Creep appears stationary.
- Main problem: the existing diagnostic wrote Memory early, used a large production-like helper before a read-only observation, and repeated several explanations in FAQ form.
- Risk: one unchanged tick could be treated as a fault, or traffic, fatigue, duplicate movement calls, and `ERR_NO_PATH` could be collapsed into one vague “stuck” state.
- Before score: **90/100**.
  - Technical accuracy and code safety: 22/24
  - Search intent and task completion: 16/18
  - Original value and insight: 13/15
  - Natural English and editorial quality: 10/12
  - Structure and readability: 8/10
  - Evidence transparency: 8/8
  - SEO and internal links: 8/8
  - Accessibility and page standards: 5/5

### `screeps-err-no-path`

- Target reader: an intermediate player debugging a path search that returns `ERR_NO_PATH` or an incomplete PathFinder result.
- Main problem: the existing page covered many APIs but made the first-pass diagnostic harder to extract than necessary and repeated the summary in an FAQ.
- Risk: readers could increase `maxOps` before checking an impossible goal range, a rejected room, or an incorrect CostMatrix.
- Before score: **92/100**.
  - Technical accuracy and code safety: 23/24
  - Search intent and task completion: 16/18
  - Original value and insight: 13/15
  - Natural English and editorial quality: 10/12
  - Structure and readability: 9/10
  - Evidence transparency: 8/8
  - SEO and internal links: 8/8
  - Accessibility and page standards: 5/5

## Editorial changes

### Shared changes

- Removed repeated FAQ copy; the route now omits `FAQPage` structured data for these pages because `faq` is intentionally empty.
- Added explicit “Use this guide when” and “Choose another guide when” boundaries.
- Separated current-tick return values from later-tick observable results.
- Kept official documentation links and visible verification levels.
- Preserved `Screeps Console test: Pending` and `Live multi-tick verification: Pending`.
- Removed generic summaries, repeated conclusions, and template-like checklists that did not change the reader's next action.
- Updated `dateModified` only for these substantively edited pages.

### `screeps-err-not-in-range`

- Leads with the smallest correct move-then-retry pattern.
- Distinguishes action result from movement result.
- Groups common actions by required range and explains why the `range` option does not change the action's own rules.
- Adds a safer reusable diagnostic helper only after the minimal example.
- Adds explicit stop conditions for invalid target, missing active `MOVE`, spawning state, non-range action failures, and already-satisfied range.

### `screeps-moveto-not-moving`

- Starts with a read-only snapshot before any Memory-writing probe.
- Adds a bounded, target-aware multi-tick probe so changed targets or desired ranges reset the observation.
- Shows how to detect more than one movement intent in the same tick.
- Separates fatigue, slow terrain/body design, traffic, stale path reuse, room-edge transitions, and path-search failure.
- Avoids presenting a fixed number of unchanged ticks as universal live proof.

### `screeps-err-no-path`

- Separates `ERR_NO_PATH`, cached-path `ERR_NOT_FOUND`, and `PathFinder.search().incomplete` before remediation.
- Orders checks from request validity and goal range through matrix rules, callbacks, search limits, and room-level routes.
- Adds a non-mutating PathFinder probe before production recovery logic.
- Keeps roads, containers, owned Ramparts, and public Ramparts walkable in the diagnostic CostMatrix.
- Explains when `Game.map.findRoute()` is a room-level diagnosis rather than a replacement for tile-level PathFinder work.

## Final internal scorecards

Each score is an internal editorial gate, not a Google score, ranking guarantee, certification, or third-party assessment.

| Article | Technical /24 | Intent /18 | Original /15 | English /12 | Structure /10 | Evidence /8 | SEO /8 | Accessibility /5 | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `screeps-err-not-in-range` | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| `screeps-moveto-not-moving` | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| `screeps-err-no-path` | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |

The one-point technical deduction reflects the absence of a real Screeps Console run and live multi-tick evidence. The one-point original-value deduction avoids treating a focused diagnostic rewrite as original experimental research.

## Verification and release boundary

The dedicated `scripts/check-english-editorial-20260731.mjs` gate validates:

- exactly three existing routes and unchanged Chinese mappings;
- distinct search intent, metadata synchronization, and `dateModified` scope;
- table-of-contents anchors;
- JavaScript syntax for every code block;
- removal of repeated FAQ structured data;
- prohibited AI-style phrases;
- explicit static evidence and Pending live evidence;
- fixed score-component thresholds and total score of 98.

The script is part of `prebuild`, so the repository's existing content, internal-link, TypeScript, ESLint, build, structured-data, accessibility, smoke, and other project checks remain mandatory. The branch must not be merged if any required check fails.

## Evidence still required after merge approval

- Real Screeps Console execution for each minimal example.
- Live observations spanning multiple ticks for movement progress and path recovery.
- Room screenshots only if captured from a real test and linked to the exact code/version.
- Production Vercel validation of metadata, canonical, hreflang, structured data, desktop layout, and mobile layout.
- Search Console evaluation only after access to a real property or export is available.

## Suggested next batch

Based on static priority, the next existing English pages worth auditing are:

1. `/en/blog/screeps-cpu-getused-bucket` — measurement boundaries, Simulation caveats, and production sampling.
2. `/en/blog/screeps-memory-basics` — beginner overlap with working-state and global-cache pages.
3. `/en/blog/screeps-spawncreep-return-codes` — return-code intent overlap with the beginner spawning lesson.
4. `/en/blog/screeps-pathfinder-costmatrix` — overlap boundary with `ERR_NO_PATH` and production matrix ownership rules.
5. `/en/blog/screeps-first-room-code` — integrated example size, error handling, and beginner next-step clarity.
