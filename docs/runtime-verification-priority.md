# Screeps runtime verification priority

The public verification fields must only change after reproducible evidence exists. Documentation review, syntax checks, and offline simulation do not imply Console or live-room verification.

## Priority guide set

Start with the highest-value operational/debugging guides:

1. `/blog/screeps-moveto-not-moving`
2. `/blog/screeps-err-not-in-range`
3. `/blog/screeps-spawncreep-return-codes`
4. `/blog/screeps-cpu-getused-bucket`
5. `/blog/screeps-upgrader-controller-link-not-upgrading`
6. `/blog/screeps-link-transfer-energy`
7. `/blog/screeps-tower-auto-attack-hostiles`
8. `/blog/screeps-market-deal`
9. `/blog/screeps-memory-basics`
10. `/blog/screeps-multi-spawn-queue`

## Console evidence minimum

A Console-tested claim should record:

- shard/server or environment
- observation date
- exact command or minimal code
- relevant starting object/state
- immediate return value/output
- any assumptions or limitations

Set `consoleTested` only after that evidence is stored with the article or accepted evidence record.

## Live multi-tick evidence minimum

A live-tested stateful claim should additionally record:

- room or anonymized room context
- starting tick
- ending tick or tick range
- state before the action
- immediate action return code
- one or more later-tick observations
- final state
- limitations and conditions that were not tested

Set `liveTested` only when the observed result actually proves the article's claim across the required ticks.

## Safety

Prefer read-only observations before state-changing actions. Do not run destructive, market, spawn, movement, or Memory-changing probes solely to increase a verification badge. Use an existing safe test situation or a deliberately isolated test case.

## Publication behavior

- `/verified` and `/en/verified` read the shared verification source automatically.
- English verification is only shown when an English article maps to the verified Chinese source article.
- A page with no real runtime evidence remains pending.
- Never hand-maintain a separate "verified list" that can drift from article metadata.
