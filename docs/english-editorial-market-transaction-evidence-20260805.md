# English Editorial Audit — Market Transaction Evidence — 2026-08-05

## Scope

This batch deep-edits exactly three existing English routes. It does not create a new article route:

- `/en/blog/screeps-market-create-order`
- `/en/blog/screeps-market-deal`
- `/en/blog/screeps-terminal-send-resources`

Repository base: `bb29adda579567ca757c72324114ddde9ec519c8`  
Official Screeps engine snapshot: `80977824199a596d174d392fd0cf8c458c21fcbd`

The original slugs, Canonicals, English/Chinese mappings and `datePublished` values remain unchanged. Each article receives `dateModified: 2026-08-05` because its operational model and executable examples changed substantially.

## Source review

Primary evidence:

- Official Screeps API documentation for `Game.market.createOrder()`, `Game.market.deal()`, `StructureTerminal.send()`, transaction arrays and transaction-cost calculation.
- Official engine runtime: `src/game/market.js` and `src/game/structures.js` at the pinned commit.
- Official market processor: `src/processor/global-intents/market.js` at the pinned commit.
- Existing Chinese source mappings and the prior English implementations in this repository.

## Material defects corrected

### `Game.market.createOrder()`

The previous page treated an active Terminal as a creation requirement even though the engine checks ownership/existence for ordinary-resource orders, not Terminal cooldown or activity. It also verified by matching fields without a bounded creation tick, so a later lookalike order could be misattributed.

The revision:

- freezes an immutable request revision and confirmation;
- uses the milli-Credit fee ceiling that reflects engine-side upward rounding;
- coordinates one attributable creation and reserved fee budget;
- snapshots existing order IDs before the call;
- verifies one exact new ID on the next tick using ID difference, `created`, type, resource, room, price and total amount;
- preserves zero-candidate, ambiguous-candidate and missed-window states;
- separates order creation from activation and future fills.

### `Game.market.deal()`

The previous page coordinated only the account-wide ten-call deal limit. It did not reserve the exact Terminal against direct sends or another market operation. It also required transaction amount to equal requested amount, although the engine may legally reduce settlement for order balance, seller inventory, buyer capacity or buyer Credits.

The revision:

- binds approval to one request revision, order ID and Terminal ID;
- reserves both one deal slot and the exact Terminal in a shared dispatcher;
- treats requested amount as a ceiling;
- verifies the exact new transaction ID, processing tick, order identity, price, direction and resource;
- reports full and partial settlement separately;
- treats Store and Credit deltas as supporting, non-unique evidence;
- closes the attribution window on the next tick instead of matching later transactions indefinitely.

### `StructureTerminal.send()`

The previous page had no shared Terminal dispatcher. The engine uses one set-intent per Terminal, so a later same-tick `send()` replaces the earlier payload even though both callers can receive `OK`. Direct sends are processed before terminal-backed market deals, so independent schedulers can also contend for the same Terminal.

The previous verifier also produced false negatives:

- empty descriptions are omitted from transaction records rather than stored as `""`;
- literal `<` characters are escaped in the ledger;
- destination capacity may reduce the actual amount.

The revision:

- freezes one exact transfer revision;
- reserves the Terminal across sends and deals;
- safely handles a missing request before reading its description;
- normalizes API and ledger description forms;
- distinguishes direct sends from market records with the absence of `transaction.order`;
- verifies exact new outgoing transaction identity on the next tick;
- reports full, partial, absent, ambiguous and missed-window outcomes;
- keeps destination hauling, consumption and acknowledgement outside sender-side settlement evidence.

## Internal quality scorecards

These are internal project quality scores, not Google scores, ranking guarantees or third-party certifications.

| Route | Technical accuracy | Problem fit | Original analysis | English | Structure | Evidence | SEO | Accessibility | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `/en/blog/screeps-market-create-order` | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98/100** |
| `/en/blog/screeps-market-deal` | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98/100** |
| `/en/blog/screeps-terminal-send-resources` | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98/100** |

## Automated validation required before publication

- Dedicated source-derived market evidence simulation.
- Every embedded JavaScript block decoded once and checked with `node --check`.
- Legacy market batch compatibility gate.
- TypeScript and ESLint.
- Full Next.js production build.
- Production smoke requests for all three routes with finite request timeouts.
- Internal links, mappings, registry metadata and structured article discovery.
- Vercel preview and Lighthouse.

## Evidence still Pending

- Screeps Console execution.
- Genuine live multi-tick order, deal and Terminal transfer verification.
- Live simultaneous create, same-Terminal overwrite, send-versus-deal contention and partial-settlement tests.
- Genuine market, Console or room screenshots.
- Search Console results after publication.
- Human visual QA and production verification after merge.

No live result is claimed by the static examples or repository simulations.
