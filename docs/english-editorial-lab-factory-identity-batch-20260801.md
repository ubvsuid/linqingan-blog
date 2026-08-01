# English editorial batch: exact Lab and Factory operation identity

Date: 2026-08-01  
Base branch: `clean-blog-v1`

## Scope

This batch deeply edits three existing English articles only:

1. `/en/blog/screeps-lab-run-reaction`
2. `/en/blog/screeps-lab-boost-creep`
3. `/en/blog/screeps-factory-produce`

No new article route, slug, Chinese source, redirect, or source-directory page is created.

No Search Console property or export was available. Selection is based on repository review, current official Screeps documentation, code-path analysis, search-intent separation, and the existing validation infrastructure. This batch does not claim impressions, clicks, CTR, rankings, traffic, field Core Web Vitals, production profit, live CPU improvements, player feedback, or server-test results.

## Why these pages

### Lab.runReaction()

The previous verifier accepted an output increase without requiring both input reagent decreases. A hauler or another output Lab could therefore create a plausible product balance.

The revised workflow:

- binds one request to three unique Lab IDs;
- records both reagent types before the call;
- validates recipe, stores, capacity, range, cooldown, ownership, and activity;
- requires an explicitly enforced exclusive Lab and hauling window;
- disables before `runReaction()`;
- verifies one product increase and two exact reagent decreases;
- returns no-delta, not-exclusive, unavailable, ambiguous, and exact states.

The official API allows the same input Labs to support multiple output Labs. The article therefore does not claim unique attribution without the scheduler's exclusive window.

### Lab.boostCreep()

The previous verifier only checked that the number of changed body parts matched the requested count. It did not prove that the documented indexes changed or that the final boost mineral was correct.

The revised workflow:

- stores the Creep object ID instead of relying on a reusable name;
- records the body-type sequence and all pre-call boost values;
- derives the body type through `BOOSTS`;
- predicts the documented TOUGH and non-TOUGH index order;
- validates per-part mineral and Energy budgets;
- verifies the exact index set and final boost mineral;
- reconciles both Lab Store deltas;
- corrects the documented distinction between `ERR_NOT_FOUND` and `ERR_INVALID_TARGET`;
- removes the undocumented `ERR_INVALID_ARGS` claim for `boostCreep()`.

### Factory.produce()

The previous verifier accepted an output increase without checking every component decrease. Ordinary hauling could therefore be mistaken for production.

The revised workflow:

- binds one request to an exact Factory ID;
- reads the current recipe from `COMMODITIES`;
- separates permanent `factory.level` from the temporary active `PWR_OPERATE_FACTORY` effect;
- checks cooldown, every component, and product capacity;
- requires an exclusive Factory Store window;
- records the complete component map;
- verifies the output and every component delta;
- adds the documented `ERR_BUSY` boundary;
- treats cooldown as supporting evidence rather than unique batch identity.

## Search-intent separation

- `screeps-lab-run-reaction` owns one forward reaction and its three-Store signature.
- `screeps-lab-boost-creep` owns one exact Creep boost and body-part identity.
- `screeps-factory-produce` owns one commodity batch and its component/output signature.

URLs, Chinese mappings, original publication dates, Canonical targets, hreflang mappings, and the author URL remain unchanged.

## Internal quality scores

These are project-internal editorial scores, not Google scores, ranking guarantees, certifications, or third-party assessments.

| Page | Before | Technical /24 | Intent /18 | Original /15 | English /12 | Structure /10 | Evidence /8 | SEO /8 | A11y /5 | Final |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Lab reaction | 92 | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| Lab boost | 92 | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| Factory production | 92 | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |

One technical point remains withheld because real Screeps Console execution and live multi-tick verification are Pending. One original-value point remains withheld because this is focused technical editorial analysis rather than controlled original research.

## Static validation

The dedicated gate validates:

- exactly three existing routes;
- unchanged Chinese mappings and publication dates;
- scoped `dateModified=2026-08-01`;
- synchronized titles, descriptions, intent, keywords, reading times, and scores;
- 35 table-of-contents anchors;
- 17 JavaScript blocks through `node --check`;
- current official Screeps sources;
- three exact Lab IDs and both reaction reagents;
- exact boost indexes, Creep ID, mineral values, and Lab deltas;
- permanent Factory level versus active Power effect;
- every Factory component delta;
- no FAQ data or FAQPage output;
- explicit Pending live evidence;
- publication, registry, smoke, and package integration.

## Evidence still Pending

All three pages still require:

- real Screeps Console execution;
- live multi-tick verification;
- genuine Console, Lab, Factory, Store, Creep body, or Power-effect screenshots.

Reaction checks still required:

- shared input Labs with two output Labs;
- enforced and unenforced exclusive windows;
- exact product and reagent deltas;
- reagent hauling during verification;
- rejected return codes and cooldown transitions.

Boost checks still required:

- TOUGH left-to-right selection;
- other parts right-to-left selection;
- Creep death and same-name replacement;
- wrong mineral and no eligible part;
- exact mineral and Energy consumption;
- unboost or concurrent boost interference.

Factory checks still required:

- first permanent level assignment;
- attempted different permanent level;
- active effect renewal and expiry;
- level-less and leveled recipes;
- exact component and output deltas;
- hauling during the verification window;
- real `ERR_BUSY`, cooldown, and capacity behavior.

## Release boundary

Do not merge while any required CI, Lighthouse, review, preview, or production check fails. Production metadata, Canonical, hreflang, structured data, internal links, response status, and visible Pending evidence must be checked after merge.
