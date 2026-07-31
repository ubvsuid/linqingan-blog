# English editorial core batch — 2026-07-31

## Selection boundary

This batch edits three existing English pages only. The complete English registry remains at 64 unique English routes with paired Chinese sources. No Search Console property or export was available, so selection is based on static content, intent, code, metadata, and overlap review rather than impressions, clicks, CTR, ranking, or query data.

Selected pages:

1. `/en/blog/screeps-memory-basics`
2. `/en/blog/screeps-spawncreep-return-codes`
3. `/en/blog/screeps-cpu-getused-bucket`

URLs, Canonical targets, Chinese mappings, and `datePublished` remain unchanged. `dateModified` is set to 2026-07-31 only for these substantively edited pages.

## Intent separation

- **Memory** owns the persistent-state mental model: loop-local values, disposable heap cache, serialized Memory, JSON boundaries, IDs, and reset recovery. It points cleanup and Segments work to separate pages.
- **spawnCreep() return codes** owns diagnosis of one Spawn request. It does not repeat the first-Creep tutorial or dynamic body planning.
- **CPU profiling** owns function-level measurement and comparable sampling. Bucket policy is retained only as scheduling context, not presented as proof of optimization.

## Before scores

| Page | Technical /24 | Intent /18 | Original /15 | English /12 | Structure /10 | Evidence /8 | SEO /8 | A11y /5 | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Memory basics | 21 | 16 | 13 | 10 | 9 | 8 | 8 | 5 | 90 |
| spawnCreep() return codes | 22 | 16 | 13 | 10 | 9 | 8 | 8 | 5 | 91 |
| CPU getUsed/bucket | 22 | 17 | 13 | 10 | 9 | 8 | 8 | 5 | 92 |

## Final internal scores

These are project-internal editorial scores, not Google scores, ranking guarantees, certifications, or third-party assessments.

| Page | Technical /24 | Intent /18 | Original /15 | English /12 | Structure /10 | Evidence /8 | SEO /8 | A11y /5 | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Memory basics | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| spawnCreep() return codes | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| CPU getUsed/bucket | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |

One technical point remains withheld because no real Console or live multi-tick execution was performed. One original-value point remains withheld because the work is technical editorial analysis rather than original controlled research.

## Removed or compressed

- Removed repeated FAQ sections and FAQPage data where the answers already exist in the main workflow.
- Removed broad, repeated checklists and premature production frameworks before the minimum useful example.
- Removed the overbroad Memory claim that ordinary variables never survive across ticks.
- Removed the local Spawn validator that treated `memory` as a stricter object-only API contract.
- Removed CPU sample storage in Memory from the first measurement path and deferred long-run policy design.

## Added technical value

- Memory: explicit loop-local / heap / Memory table; global-reset boundary; visibility-aware ID recovery; state transitions at empty/full boundaries.
- Spawn: complete documented return-code table; request snapshot; dryRun and final result separation; duplicate-producer diagnosis; current-tick versus later-tick evidence.
- CPU: cumulative-versus-delta mental model; equivalent-input comparison; bounded heap samples; bucket as context; essential-work-before-optional guard.

## Evidence boundary

Available evidence: official Screeps documentation review, repository source review, JavaScript syntax checks, static integration checks, and existing offline/production smoke infrastructure.

Still Pending on every selected page:

- Screeps Console test;
- live multi-tick verification;
- genuine room or Console screenshots;
- live global-reset, Spawn-contention, or shard CPU observations.

## Validation

The dedicated gate checks exactly three existing routes, unchanged Chinese mappings and publication dates, score components, distinct intent, TOC anchors, ten JavaScript blocks with `node --check`, removed FAQ data, prohibited AI-style phrases, official sources, Pending evidence, registry metadata, and build wiring. Existing repository checks remain unchanged.
