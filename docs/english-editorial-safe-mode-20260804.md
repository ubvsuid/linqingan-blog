# English editorial review: Safe Mode intent identity

Date: 2026-08-04  
Repository: `ubvsuid/linqingan-blog`  
Branch: `content/english-safe-mode-intent-20260804`

## Scope

This change deep-edits one existing English article only:

- `/en/blog/screeps-controller-activate-safe-mode`

It does not create a new article route, change the slug, alter the Chinese source path, change the Canonical pair, or change the original `datePublished` value of `2026-07-26`.

## Why this article was selected

The current page already used an explicit request, preflight checks, disable-before-call behavior and later Controller observation. Its remaining risk was not a simple duplicate retry. In the official Screeps runtime, a later `activateSafeMode()` call during the same tick removes the earlier Controller activation intent before registering the later one. Both calls may have returned `OK`, while only the last intent survives.

That behavior is operationally important in modular codebases where several room-defense modules may call the API independently. `ERR_BUSY` does not solve this case: it describes a Safe Mode that is already active in another owned room on the shard, not two accepted calls submitted in one current tick.

## Official source review

The implementation review used the official `screeps/engine` repository at commit `80977824199a596d174d392fd0cf8c458c21fcbd`.

### Runtime method

`src/game/structures.js`:

- checks ownership, available activation count, cooldown, upgrade blocking and the downgrade threshold;
- returns `ERR_BUSY` when an owned Controller already has active Safe Mode;
- stores a per-tick `lastActivateSafeMode` Controller ID;
- removes the prior Controller's activation intent when another Controller is called later in the same tick;
- sets the new Controller intent and returns `OK`.

Editorial consequence: an `OK` result does not establish that the call remains the final surviving Safe Mode intent for the tick. Every producer must use one shared final dispatcher.

### Intent processor

`src/processor/intents/controllers/activateSafeMode.js`:

- requires an owned, leveled Controller;
- requires `safeModeAvailable > 0`;
- rejects current cooldown and upgrade-block states;
- enforces the official downgrade threshold;
- marks the exact Controller for activation settlement.

### Controller settlement

`src/processor/intents/controllers/tick.js`:

- decrements the exact Controller's available activation count;
- sets Safe Mode duration and cooldown;
- does not create a unique Room event for this action.

Editorial consequence: exact next-tick Controller state is the primary evidence. The activation-count delta is only exclusive when `generateSafeMode()` and other charge changes are excluded from the verification window.

## Main changes

The revised article now:

- explains the two-`OK`, one-surviving-intent failure mode;
- distinguishes same-tick replacement from `ERR_BUSY`;
- binds approval to a unique request ID, room name and exact Controller ID;
- resolves current game objects on every tick;
- validates the official downgrade threshold before submission;
- separates request producers from one final per-tick dispatcher;
- applies deterministic priority, request-time and request-ID ordering;
- disables the selected request before calling the API;
- records pending identity only after the real return code is `OK`;
- distinguishes `accepted-pending` from observed activation;
- verifies the exact Controller on `submittedAt + 1`;
- requires active Safe Mode and a one-charge decrement for the strongest verification state;
- reports charge-generation interference as `activation-observed-charge-confounded`;
- reports another active owned room as `overwritten-or-conflicted`;
- preserves late, unavailable, rejected and unobserved states instead of auto-retrying;
- removes the repetitive FAQ section and FAQ structured data for this page;
- keeps Console and live multi-tick evidence visibly Pending.

## Search intent and overlap

The article owns the implementation intent “coordinate and verify one exact Safe Mode activation without same-tick intent replacement.”

It does not overlap:

- Controller downgrade recovery, which owns emergency upgrading and hysteresis;
- Tower attack, heal and repair articles, which own active defensive intents;
- Rampart access or fortification repair, which own structure policy;
- Safe Mode charge generation, which is mentioned only as a verification confound;
- strategic threat classification, diplomacy or room-selection policy.

No merge, redirect or slug change is recommended.

## Internal scorecard

This is a project-internal editorial score, not a Google score, ranking guarantee, certification or third-party assessment.

| Dimension | Score | Evidence |
|---|---:|---|
| Technical accuracy | 23/24 | Official runtime and processor behavior reviewed; live shard execution remains Pending |
| Search-intent fit | 18/18 | One focused operational problem with a complete implementation path |
| Original value | 14/15 | Exposes a non-obvious same-tick intent replacement failure; no first-party runtime trace yet |
| English quality | 12/12 | Direct technical English with explicit state names and evidence limits |
| Structure | 10/10 | Failure mode, contract, implementation, verification, failures and integration boundary |
| Evidence transparency | 8/8 | Engine commit disclosed; Console and live evidence labeled Pending |
| SEO | 8/8 | Stable URL, synchronized title/description/keywords/search intent and scoped modified date |
| Accessibility | 5/5 | Descriptive headings, tables, code context and no image-dependent instructions |
| **Final** | **98/100** | Above the project's 96-point publication threshold |

## Automated validation

`scripts/article-simulations/12-safe-mode-intent-20260804.mjs` is auto-discovered by the existing `simulationcheck` prebuild step. It validates:

- the unchanged English route, Chinese mapping and publication date;
- synchronized metadata and the 98-point score;
- 13 or more TOC anchors and matching body anchors;
- 10 or more JavaScript code blocks through `node --check`;
- exact Controller identity checks;
- the official downgrade threshold boundary;
- deterministic candidate selection;
- waiting, verified, confounded, overwritten, unobserved and late verification states;
- explicit Pending live evidence.

The existing Controller batch check, English discovery, mapping, interface, TypeScript, ESLint, production build and smoke suites remain active. No threshold is lowered.

## Evidence still Pending

- real Screeps Console execution;
- two same-tick calls showing that the later call replaces the earlier accepted intent;
- one coordinator-controlled activation across multiple owned rooms;
- exact next-tick Safe Mode duration and activation-count observation;
- `generateSafeMode()` interference observation;
- active Safe Mode `ERR_BUSY` observation on the same shard;
- downgrade-threshold `ERR_TIRED` observation;
- genuine Console and Controller screenshots;
- Search Console performance data;
- production verification after merge.
