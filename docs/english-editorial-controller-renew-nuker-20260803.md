# English editorial batch: Controller missions, renewCreep identity, and Nuker proof

Date: 2026-08-03  
Repository: `ubvsuid/linqingan-blog`  
Formal branch: `content/english-editorial-controller-renew-nuker-20260803`

## Scope

This batch deep-edits three existing English routes only:

1. `/en/blog/screeps-reserve-vs-claim-controller`
2. `/en/blog/screeps-renew-creep`
3. `/en/blog/screeps-nuker-launch`

No new article route, slug, Chinese page, Canonical URL, hreflang pair, or `datePublished` value is created or changed. Search Console data was not available and was not inferred.

## Selection rationale

### Reserve vs Claim

The existing page had useful strategy and return-code checks, but an accepted Controller action was not tied to a durable Claimer-and-Controller pending record. It also treated reserve and claim verification too similarly even though the engine exposes different evidence for each operation.

### renewCreep

The existing page documented formulas, Boost removal and a persistent renewal state. It did not coordinate both Spawn and Creep identity across multiple schedulers or distinguish an accepted call from a next-tick TTL signature. Spawn Energy was discussed without labeling transfer interference.

### Nuker launch

The existing page already required target-bound confirmation and disabled a request before launch. It did not preserve an accepted operation record with exact launcher and target identity, and it did not separate local launcher proof from optional target-room Nuke-object proof.

## Official engine review

The implementation review used the official `screeps/engine` repository at commit `80977824199a596d174d392fd0cf8c458c21fcbd`.

### reserveController

`src/processor/intents/creeps/reserveController.js`:

- validates the acting Creep, Controller, range and active CLAIM capability;
- increases reservation time subject to the official cap;
- writes `EVENT_RESERVE_CONTROLLER` with the acting Creep as `objectId`;
- records `data.amount` but no Controller `targetId`.

Editorial consequence: reserve verification must combine the exact Claimer event with the pending room, exact Controller ID and current reservation username. The article must not invent a target ID in the event.

### claimController

`src/processor/intents/creeps/claimController.js`:

- validates a neutral Controller, CLAIM capability, reservation and account capacity;
- assigns the Controller to the user at level 1 and clears the reservation;
- adds the room to the user;
- does not write a Room event.

Editorial consequence: the exact saved Controller owner is primary evidence. GCL or an account room-count change is only corroboration.

### renewCreep

`src/processor/intents/spawns/renew-creep.js` and `src/game/creeps.js`:

- the Spawn must be idle, active, owned and adjacent to the owned Creep;
- any CLAIM body part makes the Creep ineligible;
- the exact Spawn is charged the renewal Energy cost;
- the exact Creep lifetime is increased;
- all Boosts are removed and body capacity is recalculated;
- no Room event is created;
- API `ticksToLive` is derived from lifetime end time minus current game time.

Editorial consequence: under a one-dispatch contract, the next-tick signature is `before TTL - 1 + planned renewal step`. Spawn Energy remains secondary evidence because transfers can affect the same Store.

### launchNuke

`src/processor/intents/nukers/launch-nuke.js` and `src/game/nukes.js`:

- the exact Nuker's Energy and Ghodium Stores are set to zero;
- the Nuker cooldown is set;
- a Nuke object is inserted at the requested target room and coordinates;
- the Nuke records `launchRoomName` and exposes `timeToLand`;
- no Room event is created.

Editorial consequence: local proof is the exact Nuker ID plus positive cooldown and zero resources. Optional target proof must match position and launching room when the target room is visible.

## Article changes

### Reserve or Claim a Controller Without Losing Mission Identity

Added:

- reviewed `roomName` and `controllerId` mission identity;
- exact Claimer ownership, spawning and active CLAIM checks;
- claim confirmation bound to room and Controller ID;
- accepted-call pending state with action, Claimer ID, Controller ID, username and before state;
- reserve verification through exact `EVENT_RESERVE_CONTROLLER` actor plus exact Controller state;
- explicit documentation that reserve events do not contain Controller target IDs;
- claim verification through exact next-tick Controller ownership;
- missed, missing, ambiguous, invisible and identity-mismatch states.

Removed or replaced:

- repetitive Quick Answer, FAQ and debugging checklist sections;
- the implication that disabling an accepted claim equals verified completion;
- generic next-tick instructions without operation identity.

### Renew a Creep Without Hiding Spawn Contention or Boost Loss

Added:

- one-step TTL and Energy calculation;
- any-CLAIM-part rejection matching the engine boundary;
- explicit Boost-removal approval;
- one dispatcher reserving both Spawn and Creep IDs;
- accepted-call pending state with exact IDs, before TTL, Spawn Energy, Boosts, expected TTL and expected cost;
- next-tick TTL signature `before - 1 + added`;
- Boost-removal verification;
- Energy transfer event detection and confounded status;
- verified mission-state clearing.

Removed or replaced:

- repetitive FAQ, Quick Answer and checklist material;
- TTL growth as a standalone success claim;
- a renewal flag as proof that a particular call executed;
- net Spawn Energy as exclusive attribution.

### Launch a Nuke Once and Preserve the Exact Operation Record

Added:

- confirmation bound to exact Nuker ID and target room/coordinates;
- exact Nuker type, ownership, active state, cooldown, range and Store preflight;
- accepted-call pending record with launcher, target, expected cooldown/landing and before state;
- local launcher verification through positive cooldown and zero Energy/Ghodium;
- optional exact target Nuke match by coordinates and `launchRoomName`;
- separate current `timeToLand` and submitted absolute expected landing value;
- missing, unavailable and ambiguous evidence states.

Removed or replaced:

- repetitive FAQ, Quick Answer and checklist material;
- generic post-launch evidence without exact operation identity;
- any implication that target-room vision is required to submit the call;
- any implied target selection, diplomacy, damage prediction or strategic recommendation.

## Intent and overlap boundaries

- Reserve/Claim owns remote reservation versus permanent ownership and operation verification.
- Controller downgrade remains emergency upgrading and does not overlap this mission choice.
- renewCreep owns lifetime extension, Spawn contention and Boost-loss evidence.
- emergency harvester recovery owns replacement spawning, not lifetime extension.
- Nuker launch owns irreversible submission and post-launch identity.
- fortification repair and Tower defense remain current-room defensive maintenance, not strategic Nuke targeting.

No merge or redirect is recommended for these routes because their user goals and operation contracts remain distinct.

## Internal scorecards

These are project-internal editorial scores, not Google scores, ranking guarantees or third-party certifications.

| Article | Before | Technical | Intent | Original value | English | Structure | Evidence | SEO | Accessibility | Final |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Reserve vs Claim | 91 | 23/24 | 18/18 | 14/15 | 12/12 | 10/10 | 8/8 | 8/8 | 5/5 | 98/100 |
| renewCreep | 91 | 23/24 | 18/18 | 14/15 | 12/12 | 10/10 | 8/8 | 8/8 | 5/5 | 98/100 |
| Nuker launch | 90 | 23/24 | 18/18 | 14/15 | 12/12 | 10/10 | 8/8 | 8/8 | 5/5 | 98/100 |

The one-point technical deduction reflects missing live Screeps execution. The one-point original-value deduction reflects missing first-party runtime traces and screenshots.

## Automated gates

The batch adds `scripts/check-english-editorial-controller-renew-nuker-20260803.mjs` to `prebuild`.

It enforces:

- three existing routes and Chinese mappings;
- synchronized updated registry metadata;
- three 98-point scorecards;
- empty FAQ arrays and no new FAQPage output;
- 16 JavaScript blocks with syntax validation;
- exact reserve actor evidence without a fabricated target ID;
- exact claim ownership evidence without a fabricated event;
- exact renewal Spawn/Creep identity, TTL signature, Boost boundary and transfer-confound label;
- exact Nuker local signature and optional target identity;
- 22 offline boundary cases;
- explicit Pending Console, live-loop and screenshot evidence.

The existing Controller, lifecycle and defense production smoke modules are updated rather than bypassed. Registries that expose `updatedAt` share one `DatedEnglishArticleRecord` type so future metadata changes do not require copy-pasted type edits.

## Dependency and publication order

The formal PR is intentionally stacked:

1. Merge PR `#91` into `clean-blog-v1`.
2. Retarget or rebase PR `#92`, rerun its gates, and merge it.
3. Retarget or rebase PR `#94`, rerun its gates, and merge it.
4. Retarget or rebase this branch onto the updated `clean-blog-v1` branch.
5. Rerun Site quality, Lighthouse, Vercel Preview and human desktop/mobile QA.
6. PR `#96` is the only authorized merge path for this batch. After it merges, run the required production verification checks.

A CI-only validation PR may validate the combined dependency stack against the default branch. It must close after Site quality, Lighthouse, Vercel Preview and optional review validation complete. It is not an authorized merge path and does not convert the accumulated stack into one publication batch.

## Evidence still Pending

- Screeps Console execution;
- live next-tick reserve event and exact reservation state;
- live claim ownership transition and hostile reservation handling;
- live single- and dual-Spawn renewal coordination;
- live Boost removal and capacity/resource drop behavior;
- live Spawn Energy transfer interference;
- live protected-area Nuker rejection;
- live accepted launch, cooldown and Store consumption;
- live target-room Nuke object and landing timing;
- CPU and Memory measurements;
- genuine room and Console screenshots;
- Search Console evidence;
- complete desktop and mobile visual QA;
- post-merge production verification.

## Recommended next batch

Earlier batch records preserve their recommendation lists as historical snapshots at the time each record was written. The list below is the current recommendation for the combined stack after this batch:

1. `/en/blog/screeps-controller-activate-safe-mode`
2. `/en/blog/screeps-rampart-set-public`
3. `/en/blog/screeps-recycle-creep`

All three are one-time or high-impact operations that can benefit from exact accepted-intent and later-state evidence models without creating new articles.
